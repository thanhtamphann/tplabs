import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(url, serviceKey);
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: request.headers.get("Authorization") ?? "" } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const { workspaceId, email, role = "viewer", redirectTo } = await request.json();
    const { data: membership } = await admin.from("workspace_members").select("role").eq("workspace_id", workspaceId).eq("user_id", user.id).single();
    if (!membership || !["owner", "admin"].includes(membership.role)) throw new Error("Admin permission required");
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo, data: { workspace_id: workspaceId, role } });
    if (error) throw error;
    await admin.from("invitations").insert({ workspace_id: workspaceId, email, role, invited_by: user.id });
    return new Response(JSON.stringify({ invited: true, userId: data.user?.id }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
