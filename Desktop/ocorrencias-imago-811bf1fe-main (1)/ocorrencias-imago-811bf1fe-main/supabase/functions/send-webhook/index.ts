import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  evento: string;
  timestamp: string;
  dados: {
    id: string;
    protocolo: string;
    tipo: string;
    subtipo: string;
    descricao: string;
    paciente_nome: string;
    criado_em: string;
    criado_por: string;
    link: string;
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client to verify the user
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
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("[Webhook] Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { payload, webhookUrl } = await req.json() as { payload: WebhookPayload; webhookUrl?: string };

    if (!payload) {
      return new Response(
        JSON.stringify({ error: "Payload is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client to fetch tenant settings
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

    // Get user's tenant
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      console.error("[Webhook] Profile not found for user:", user.id);
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get tenant settings to find webhook URL
    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("settings")
      .eq("id", profile.tenant_id)
      .single();

    const settings = (tenant?.settings || {}) as { webhook_url?: string; webhook_enabled?: boolean };
    const targetUrl = webhookUrl || settings.webhook_url;

    if (!targetUrl) {
      console.log("[Webhook] No webhook URL configured");
      return new Response(
        JSON.stringify({ success: true, message: "No webhook URL configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (settings.webhook_enabled === false) {
      console.log("[Webhook] Webhook is disabled");
      return new Response(
        JSON.stringify({ success: true, message: "Webhook is disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Webhook] Sending to:", targetUrl);
    console.log("[Webhook] Payload:", JSON.stringify(payload));

    const buildGetUrl = (baseUrl: string) => {
      const url = new URL(baseUrl);
      url.searchParams.set("payload", JSON.stringify(payload));
      return url.toString();
    };

    const trySend = async (method: "POST" | "GET") => {
      console.log("[Webhook] Method:", method);

      if (method === "GET") {
        const getUrl = buildGetUrl(targetUrl);
        return await fetch(getUrl, { method: "GET" });
      }

      return await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    };

    // n8n webhooks in "test" mode commonly expect GET while listening.
    const preferredMethod: "POST" | "GET" = targetUrl.includes("/webhook-test/") ? "GET" : "POST";

    let webhookResponse = await trySend(preferredMethod);

    // If POST was rejected by n8n test endpoint, retry as GET.
    if (preferredMethod === "POST" && webhookResponse.status === 404) {
      const maybeText = await webhookResponse.clone().text();
      if (maybeText.includes("not registered for POST")) {
        console.log("[Webhook] POST not registered, retrying as GET");
        webhookResponse = await trySend("GET");
      }
    }

    const responseStatus = webhookResponse.status;
    console.log("[Webhook] Response status:", responseStatus);

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error("[Webhook] Error response:", errorText);

      const hint = errorText.includes("not registered for POST")
        ? "No n8n, confirme se o workflow está ativo e se você está usando a URL correta (produção vs teste)."
        : undefined;

      return new Response(
        JSON.stringify({
          success: false,
          status: responseStatus,
          error: `Webhook returned ${responseStatus}`,
          details: errorText?.slice?.(0, 1000) ?? String(errorText),
          hint,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, status: responseStatus }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("[Webhook] Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
