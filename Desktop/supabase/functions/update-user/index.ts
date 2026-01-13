import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateUserRequest {
  user_id: string;
  full_name?: string;
  email?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header to verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Create regular client to verify the requesting user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the requesting user
    const { data: { user: requestingUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is admin
    const { data: isAdmin } = await supabaseAdmin.rpc("is_tenant_admin", {
      _user_id: requestingUser.id,
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Only admins can update users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { user_id, full_name, email }: UpdateUserRequest = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get tenant_id of requesting user
    const { data: requestingProfile } = await supabaseAdmin
      .from("profiles")
      .select("tenant_id")
      .eq("id", requestingUser.id)
      .single();

    if (!requestingProfile) {
      return new Response(
        JSON.stringify({ error: "Admin profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user to update belongs to the same tenant
    const { data: userToUpdate } = await supabaseAdmin
      .from("profiles")
      .select("tenant_id, email, full_name")
      .eq("id", user_id)
      .single();

    if (!userToUpdate) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (userToUpdate.tenant_id !== requestingProfile.tenant_id) {
      return new Response(
        JSON.stringify({ error: "Cannot update user from another tenant" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Updating user ${user_id}`);

    // Update profile
    const profileUpdates: Record<string, string> = {};
    if (full_name) profileUpdates.full_name = full_name;
    if (email) profileUpdates.email = email;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update(profileUpdates)
        .eq("id", user_id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        return new Response(
          JSON.stringify({ error: "Failed to update profile" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Update auth email if changed
    if (email && email !== userToUpdate.email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        email,
        email_confirm: true,
      });

      if (authError) {
        console.error("Auth update error:", authError);
        // Rollback profile email change
        await supabaseAdmin
          .from("profiles")
          .update({ email: userToUpdate.email })
          .eq("id", user_id);
          
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Log audit event
    await supabaseAdmin.from("audit_logs").insert({
      tenant_id: requestingProfile.tenant_id,
      user_id: requestingUser.id,
      action: "user_update",
      entity_type: "user",
      entity_id: user_id,
      details: { 
        changes: profileUpdates, 
        updated_by: requestingUser.email 
      },
    });

    console.log(`User ${user_id} updated successfully`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
