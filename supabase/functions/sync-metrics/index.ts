import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function nextSyncDate(publishedAt?: string | null) {
  const now = Date.now();
  const ageHours = publishedAt ? (now - new Date(publishedAt).getTime()) / 3_600_000 : 999;
  const waitHours = ageHours < 1 ? 1 - ageHours : ageHours < 6 ? 6 - ageHours : ageHours < 24 ? 24 - ageHours : ageHours < 72 ? 72 - ageHours : ageHours < 168 ? 168 - ageHours : ageHours < 720 ? 24 : 168;
  return new Date(now + Math.max(waitHours, 1) * 3_600_000).toISOString();
}

function youtubeId(url: string, externalId?: string | null) {
  if (externalId) return externalId;
  const match = url.match(/(?:youtu\.be\/|shorts\/|watch\?v=|embed\/)([\w-]{6,})/i);
  return match?.[1] ?? null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const youtubeKey = Deno.env.get("YOUTUBE_API_KEY");
    const authHeader = request.headers.get("Authorization") ?? "";
    const admin = createClient(supabaseUrl, serviceKey);
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    const { data: memberships } = await admin.from("workspace_members").select("workspace_id,role").eq("user_id", user.id).eq("status", "active").in("role", ["owner","admin","content_manager"]);
    const workspaceIds = (memberships ?? []).map((m: { workspace_id: string }) => m.workspace_id);
    if (!workspaceIds.length) return new Response(JSON.stringify({ synced: 0 }), { headers: { ...cors, "Content-Type": "application/json" } });

    const { data: posts, error } = await admin.from("published_posts").select("*").in("workspace_id", workspaceIds).eq("status", "published").or(`next_sync_at.is.null,next_sync_at.lte.${new Date().toISOString()}`).limit(50);
    if (error) throw error;
    const results = [];

    for (const post of posts ?? []) {
      try {
        let metrics: Record<string, number | string | null> = {};
        if (post.platform === "YouTube") {
          if (!youtubeKey) throw new Error("YOUTUBE_API_KEY is not configured");
          const id = youtubeId(post.post_url, post.external_post_id);
          if (!id) throw new Error("Cannot detect YouTube video ID");
          const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${encodeURIComponent(id)}&key=${encodeURIComponent(youtubeKey)}`);
          const payload = await response.json();
          if (!response.ok || !payload.items?.length) throw new Error(payload.error?.message ?? "Video not found");
          const stats = payload.items[0].statistics;
          metrics = { views: Number(stats.viewCount || 0), likes: Number(stats.likeCount || 0), comments: Number(stats.commentCount || 0) };
        } else {
          throw new Error(`${post.platform} connector requires an approved OAuth app`);
        }

        const views = Number(metrics.views || 0), likes = Number(metrics.likes || 0), comments = Number(metrics.comments || 0);
        const engagementRate = views ? ((likes + comments + Number(post.shares || 0) + Number(post.saves || 0)) / views) * 100 : 0;
        const score = Math.min(100, Math.round((Math.min(views / 100000, 1) * 30 + Math.min(engagementRate / 10, 1) * 20 + (Number(post.retention_rate || 0) / 100) * 25 + 15 + 10) * 100) / 100);
        const update = { ...metrics, engagement_rate: engagementRate, performance_score: score, last_synced_at: new Date().toISOString(), next_sync_at: nextSyncDate(post.published_at), sync_error: null };
        await admin.from("published_posts").update(update).eq("id", post.id);
        await admin.from("metric_snapshots").insert({ published_post_id: post.id, ...metrics, engagement_rate: engagementRate, performance_score: score, raw_metrics: metrics });
        results.push({ id: post.id, status: "synced" });
      } catch (syncError) {
        await admin.from("published_posts").update({ sync_error: String(syncError), last_synced_at: new Date().toISOString(), next_sync_at: nextSyncDate(post.published_at) }).eq("id", post.id);
        results.push({ id: post.id, status: "failed", error: String(syncError) });
      }
    }
    return new Response(JSON.stringify({ synced: results.filter(x => x.status === "synced").length, results }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
