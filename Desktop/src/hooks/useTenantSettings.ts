import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface TenantSettings {
  webhook_url?: string;
  webhook_enabled?: boolean;
}

export function useTenantSettings() {
  const { tenant } = useAuth();

  return useQuery({
    queryKey: ["tenant-settings", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;

      const { data, error } = await supabase
        .from("tenants")
        .select("settings")
        .eq("id", tenant.id)
        .single();

      if (error) throw error;

      return (data?.settings || {}) as TenantSettings;
    },
    enabled: !!tenant?.id,
  });
}

export function useUpdateTenantSettings() {
  const queryClient = useQueryClient();
  const { tenant } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newSettings: Partial<TenantSettings>) => {
      if (!tenant?.id) throw new Error("Tenant não encontrado");

      // Fetch current settings
      const { data: current } = await supabase
        .from("tenants")
        .select("settings")
        .eq("id", tenant.id)
        .single();

      const currentSettings = (current?.settings || {}) as TenantSettings;
      const mergedSettings = { ...currentSettings, ...newSettings };

      const { error } = await supabase
        .from("tenants")
        .update({ settings: mergedSettings })
        .eq("id", tenant.id);

      if (error) throw error;

      return mergedSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-settings"] });
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Function to trigger webhook via Edge Function (avoids CORS issues)
export async function triggerWebhook(
  webhookUrl: string,
  occurrenceData: {
    id: string;
    protocolo: string;
    tipo: string;
    subtipo: string;
    descricao: string;
    paciente_nome?: string | null;
    criado_em: string;
    criado_por_nome?: string;
  }
) {
  try {
    const payload = {
      evento: "nova_ocorrencia",
      timestamp: new Date().toISOString(),
      dados: {
        id: occurrenceData.id,
        protocolo: occurrenceData.protocolo,
        tipo: occurrenceData.tipo,
        subtipo: occurrenceData.subtipo,
        descricao: occurrenceData.descricao,
        paciente_nome: occurrenceData.paciente_nome || "Não informado",
        criado_em: occurrenceData.criado_em,
        criado_por: occurrenceData.criado_por_nome || "Sistema",
        link: `${window.location.origin}/ocorrencias/${occurrenceData.id}`,
      },
    };

    // Send via Edge Function to avoid CORS issues
    const { data, error } = await supabase.functions.invoke("send-webhook", {
      body: { payload, webhookUrl },
    });

    if (error) {
      console.error("[Webhook] Edge function error:", error);
      return false;
    }

    console.log("[Webhook] Response:", data);
    return data?.success ?? true;
  } catch (error) {
    console.error("[Webhook] Erro ao preparar payload:", error);
    return false;
  }
}

// Function to send generic data to a webhook (for n8n integrations)
export async function sendToWebhook(webhookUrl: string, payload: Record<string, unknown>) {
  try {
    const { data, error } = await supabase.functions.invoke("send-webhook", {
      body: { 
        payload: {
          ...payload,
          timestamp: new Date().toISOString(),
        }, 
        webhookUrl 
      },
    });

    if (error) {
      console.error("[Webhook] Edge function error:", error);
      return false;
    }

    console.log("[Webhook] Response:", data);
    return data?.success ?? true;
  } catch (error) {
    console.error("[Webhook] Erro ao enviar para webhook:", error);
    return false;
  }
}
