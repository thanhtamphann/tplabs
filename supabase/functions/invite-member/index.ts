import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const roles = new Set(["admin", "content_manager", "scriptwriter", "editor", "reviewer", "viewer"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const publishableKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const userClient = createClient(url, publishableKey, { global: { headers: { Authorization: request.headers.get("Authorization") ?? "" } } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    const body = await request.json();
    const action = String(body.action || "invite");
    const workspaceId = String(body.workspaceId || "");
    const email = String(body.email || "").trim().toLowerCase();
    const role = String(body.role || "viewer");
    const channelScope = Array.isArray(body.channelScope) ? body.channelScope : [];
    if (!workspaceId || !email) return json({ error: "Workspace and email are required" }, 400);
    if (!roles.has(role)) return json({ error: "Invalid role" }, 400);

    const { data: caller } = await admin.from("workspace_members").select("role").eq("workspace_id", workspaceId).eq("user_id", user.id).eq("status", "active").single();
    if (!caller || !["owner", "admin"].includes(caller.role)) return json({ error: "Admin permission required" }, 403);
    if (caller.role !== "owner" && (role === "admin" || action === "revoke")) return json({ error: "Only Owner can assign Admin or revoke access" }, 403);

    const { data: target } = await admin.from("workspace_members").select("user_id,role,email").eq("workspace_id", workspaceId).eq("email", email).maybeSingle();
    if (target?.role === "owner") return json({ error: "Owner access cannot be changed" }, 403);
    if (target?.user_id === user.id) return json({ error: "You cannot change your own access" }, 403);

    if (action === "revoke") {
      await admin.from("workspace_members").delete().eq("workspace_id", workspaceId).eq("email", email);
      await admin.from("invitations").delete().eq("workspace_id", workspaceId).eq("email", email);
      const { error } = await admin.rpc("set_authorized_user", { target_email: email, is_active: false, actor: user.id });
      if (error) throw error;
      return json({ revoked: true });
    }

    if (action === "update") {
      if (!target) return json({ error: "Member not found" }, 404);
      const { error } = await admin.from("workspace_members").update({ role, channel_scope: channelScope }).eq("workspace_id", workspaceId).eq("user_id", target.user_id);
      if (error) throw error;
      return json({ updated: true });
    }

    if (action !== "invite") return json({ error: "Invalid action" }, 400);
    const { error: allowError } = await admin.rpc("set_authorized_user", { target_email: email, is_active: true, actor: user.id });
    if (allowError) throw allowError;

    const { data: invitation, error: inviteRowError } = await admin.from("invitations").insert({ workspace_id: workspaceId, email, role, channel_scope: channelScope, invited_by: user.id }).select("id").single();
    if (inviteRowError) throw inviteRowError;

    const { data: usersPage, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) throw listError;
    const existingUser = usersPage.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (existingUser) {
      const { error } = await admin.from("workspace_members").upsert({ workspace_id: workspaceId, user_id: existingUser.id, email, display_name: existingUser.user_metadata?.full_name || email, role, channel_scope: channelScope, status: "active" });
      if (error) throw error;
      await admin.from("invitations").update({ accepted_at: new Date().toISOString() }).eq("id", invitation.id);
      return json({ invited: true, userId: existingUser.id, existing: true });
    }

    const redirectTo = Deno.env.get("APP_URL") || "https://thanhtamphann.github.io/tplabs/";
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (error) {
      await admin.from("invitations").delete().eq("id", invitation.id);
      await admin.rpc("set_authorized_user", { target_email: email, is_active: false, actor: user.id });
      throw error;
    }
    return json({ invited: true, userId: data.user?.id });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 400);
  }
});
