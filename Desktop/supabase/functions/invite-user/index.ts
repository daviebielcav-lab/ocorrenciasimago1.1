import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteUserRequest {
  email: string;
  full_name: string;
  role: "admin" | "user";
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

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
        JSON.stringify({ error: "Only admins can invite users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get tenant info
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

    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("name")
      .eq("id", requestingProfile.tenant_id)
      .single();

    // Parse request body
    const { email, full_name, role }: InviteUserRequest = await req.json();

    if (!email || !full_name) {
      return new Response(
        JSON.stringify({ error: "Email and full_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tenant_id = requestingProfile.tenant_id;
    const tenantName = tenant?.name || "IMAGO";

    console.log(`Inviting user ${email} to tenant ${tenant_id}`);

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "email_exists",
          message: "Este email já está cadastrado.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a secure invite token
    const inviteToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store the invite in a pending_invites record (we'll use password_reset_tokens table or create invite)
    // For now, we'll use a temporary password and send magic link
    const tempPassword = crypto.randomUUID();

    // Create auth user with temporary password
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // We confirm email since we verify it ourselves
      user_metadata: {
        full_name,
        needs_password_setup: true,
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      if ((authError as any)?.code === "email_exists") {
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

    console.log(`Created user ${userId}, setting up profile and role`);

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        tenant_id,
        full_name,
        email,
        is_active: true,
      }, { onConflict: "id" });

    if (profileError) {
      console.error("Profile error:", profileError);
    }

    // Set up role
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        tenant_id,
        role: desiredRole,
      });

    if (roleError) {
      console.error("Role error:", roleError);
    }

    // Generate password reset link so user can set their own password

    const SITE_URL =
      Deno.env.get("SITE_URL") || "https://ocorrencias.imagoradiologia.cloud";

    const { data: resetData, error: resetError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo: `${SITE_URL}/reset-password`,
        },
      });

    if (resetError) {
      throw resetError;
    }

    // resetData.properties.action_link -> link final para enviar por e-mail


    if (resetError) {
      console.error("Reset link error:", resetError);
      // Continue anyway, user can use "forgot password" later
    }

    // Get the action link for the email
    const resetLink = resetData?.properties?.action_link || "";

    console.log(`Sending invite email to ${email}`);

    // Send custom invite email via Resend
    const { error: emailError } = await resend.emails.send({
      from: "IMAGO Sistema <noreply@imagoradiologia.cloud>",
      to: [email],
      subject: `Convite para ${tenantName} - Sistema de Ocorrências`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Convite - ${tenantName}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #325C93 0%, #4a7ab8 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Ocorrências Imago</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Diagnóstico por Imagem</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 22px;">
                Olá, ${full_name}! 👋
              </h2>
              
              <p style="color: #555; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                Você foi convidado(a) para acessar o <strong>Sistema de Ocorrências Imago</strong>.
              </p>
              
              <p style="color: #555; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                Para começar, clique no botão abaixo para criar sua senha de acesso:
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, #325C93 0%, #4a7ab8 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(50,92,147,0.3);">
                  Criar Minha Senha
                </a>
              </div>
              
              <p style="color: #888; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                Este link expira em <strong>7 dias</strong>. Se você não solicitou este convite, pode ignorar este email com segurança.
              </p>
              
              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="color: #aaa; font-size: 12px; margin: 0; text-align: center;">
                Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                <a href="${resetLink}" style="color: #325C93; word-break: break-all;">${resetLink}</a>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} ${tenantName}. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Email sending error:", emailError);
      // User was created but email failed - log but don't fail the request
    }

    // Log audit event
    await supabaseAdmin.from("audit_logs").insert({
      tenant_id,
      user_id: requestingUser.id,
      action: "user_invite",
      entity_type: "user",
      entity_id: userId,
      details: {
        email,
        role: desiredRole,
        invited_by: requestingUser.email,
        email_sent: !emailError,
      },
    });

    console.log(`User ${email} invited successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: userId, email, full_name, role: desiredRole },
        message: `Convite enviado para ${email}. O usuário receberá um email para criar sua senha.`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
