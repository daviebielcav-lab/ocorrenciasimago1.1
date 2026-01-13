import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  role: "admin" | "user";
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
        JSON.stringify({ error: "Only admins can create users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Parse request body
    const { email, password, full_name, role }: CreateUserRequest = await req.json();

    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ error: "Email, password and full_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tenant_id = requestingProfile.tenant_id;

    // Create auth user with user_metadata - the trigger will create the profile
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
      },
    });

    if (authError) {
      const code = (authError as any)?.code;
      console.error("Auth error:", authError);

      // Make email-already-registered a non-fatal response to avoid hard failures in the UI
      if (code === "email_exists") {
        return new Response(
          JSON.stringify({
            success: false,
            error: "email_exists",
            message: "Este email já está cadastrado.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;
    const desiredRole = role || "user";

    console.log(`Creating user ${userId} with role ${desiredRole}`);

    // Create profile directly (trigger may not fire for admin.createUser)
    const { error: profileInsertError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        tenant_id,
        full_name,
        email,
        is_active: true,
      }, { onConflict: "id" });

    if (profileInsertError) {
      console.error("Profile insert error:", profileInsertError);
    }

    // Delete existing role created by trigger
    const { error: roleDeleteError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId);
    
    if (roleDeleteError) {
      console.error("Role delete error:", roleDeleteError);
    }

    // Insert the correct role with correct tenant_id
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        tenant_id,
        role: desiredRole,
      });

    if (roleError) {
      console.error("Role insert error:", roleError);
      // Try upsert as fallback
      const { error: upsertError } = await supabaseAdmin
        .from("user_roles")
        .upsert({
          user_id: userId,
          tenant_id,
          role: desiredRole,
        }, { onConflict: "user_id,tenant_id" });
      
      if (upsertError) {
        console.error("Role upsert error:", upsertError);
      }
    }

    console.log(`User ${userId} created with role ${desiredRole}`);

    // Log audit event
    await supabaseAdmin.from("audit_logs").insert({
      tenant_id,
      user_id: requestingUser.id,
      action: "user_create",
      entity_type: "user",
      entity_id: userId,
      details: { email, role, created_by: requestingUser.email },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { id: userId, email, full_name, role } 
      }),
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