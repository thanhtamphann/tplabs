import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (request) => {
  try {
    const expected = Deno.env.get("CMS_SYNC_SECRET");
    if (!expected || request.headers.get("x-cms-sync-secret") !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
    const workspaceId = Deno.env.get("CMS_WORKSPACE_ID");
    if (!workspaceId) throw new Error("CMS_WORKSPACE_ID is not configured");
    const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const payload = await request.json();

    if (payload.site) {
      await client.from("workspaces").update({ name: payload.site.workspaceName, timezone: payload.site.timezone }).eq("id", workspaceId);
    }

    const channelRows = (payload.channels ?? []).map((item: Record<string, unknown>) => ({
      workspace_id: workspaceId, external_key: String(item.id), name: item.name, platform: item.platform,
      handle: item.handle, color: item.color, followers: item.followers ?? 0, total_views: item.views ?? 0,
      post_count: item.posts ?? 0, active: item.active ?? true
    }));
    if (channelRows.length) {
      const { error } = await client.from("channels").upsert(channelRows, { onConflict: "workspace_id,external_key" });
      if (error) throw error;
    }
    const { data: savedChannels } = await client.from("channels").select("id,name").eq("workspace_id", workspaceId);
    const channelIds = new Map((savedChannels ?? []).map((c: { id: string; name: string }) => [c.name, c.id]));

    const contentRows = (payload.content ?? []).map((item: Record<string, unknown>) => ({
      workspace_id: workspaceId, external_key: String(item.id), title: item.title,
      content_pillar: item.type ?? "General", status: String(item.status ?? "Idea").toLowerCase(),
      due_date: item.date || null, owner_name: item.owner || null,
      primary_channel_id: channelIds.get(String(item.channel)) ?? null, primary_platform: item.platform || null
    }));
    if (contentRows.length) {
      const { error } = await client.from("content_items").upsert(contentRows, { onConflict: "workspace_id,external_key" });
      if (error) throw error;
    }

    const automationRows = (payload.automations ?? []).map((item: Record<string, unknown>) => ({
      workspace_id: workspaceId, external_key: String(item.id), title: item.title,
      trigger_type: item.title, conditions: {}, actions: [{ description: item.description }], enabled: item.enabled ?? true
    }));
    if (automationRows.length) {
      const { error } = await client.from("automations").upsert(automationRows, { onConflict: "workspace_id,external_key" });
      if (error) throw error;
    }
    return new Response(JSON.stringify({ ok: true, channels: channelRows.length, content: contentRows.length, automations: automationRows.length }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
