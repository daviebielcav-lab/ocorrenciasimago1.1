import { supabase } from "@/integrations/supabase/client";
import { generateOccurrencePDF, loadLogoBase64 } from "./occurrence-pdf";
import { Occurrence } from "@/types/occurrence";
import { DbOccurrence } from "@/hooks/useOccurrences";

// Transform DB occurrence to PDF format (partial for PDF generation)
function transformToPdfFormat(dbOcc: DbOccurrence): Partial<Occurrence> & { id: string; protocolo: string; tipo: any; subtipo: any; descricaoDetalhada: string; status: any } {
  return {
    id: dbOcc.id,
    protocolo: dbOcc.protocolo,
    tenantId: dbOcc.tenant_id,
    criadoPor: dbOcc.criado_por,
    criadoEm: dbOcc.criado_em,
    atualizadoEm: dbOcc.atualizado_em,
    status: dbOcc.status as any,
    triagem: dbOcc.triagem as any,
    triagemPor: dbOcc.triagem_por || undefined,
    triagemEm: dbOcc.triagem_em || undefined,
    tipo: dbOcc.tipo as any,
    subtipo: dbOcc.subtipo as any,
    descricaoDetalhada: dbOcc.descricao_detalhada,
    acaoImediata: dbOcc.acao_imediata || "",
    impactoPercebido: dbOcc.impacto_percebido || "",
    pessoasEnvolvidas: dbOcc.pessoas_envolvidas || undefined,
    contemDadoSensivel: dbOcc.contem_dado_sensivel || false,
    dadosEspecificos: dbOcc.dados_especificos,
    paciente: {
      nomeCompleto: dbOcc.paciente_nome_completo || "",
      telefone: dbOcc.paciente_telefone || "",
      idPaciente: dbOcc.paciente_id || "",
      dataNascimento: dbOcc.paciente_data_nascimento || "",
      tipoExame: dbOcc.paciente_tipo_exame || "",
      unidadeLocal: dbOcc.paciente_unidade_local || "",
      dataHoraEvento: dbOcc.paciente_data_hora_evento || "",
    },
    desfecho: dbOcc.desfecho_tipos?.length
      ? {
          tipos: dbOcc.desfecho_tipos as any,
          justificativa: dbOcc.desfecho_justificativa || "",
          desfechoPrincipal: dbOcc.desfecho_principal as any,
          definidoPor: dbOcc.desfecho_definido_por || "",
          definidoEm: dbOcc.desfecho_definido_em || "",
        }
      : undefined,
  };
}

export async function generateAndStorePdf(dbOcc: DbOccurrence): Promise<string | null> {
  try {
    // Load logo first
    const logoBase64 = await loadLogoBase64();
    
    // Transform to PDF format
    const occurrence = transformToPdfFormat(dbOcc);

    // Generate PDF with logo
    const doc = generateOccurrencePDF({
      occurrence: occurrence as any,
      includeHistory: true,
      includeOutcome: true,
      includeCapa: true,
      includeAttachments: false,
      anonymize: false,
      logoBase64: logoBase64 || undefined,
    });

    // Convert to blob
    const pdfBlob = doc.output("blob");
    const fileName = `${dbOcc.protocolo.replace(/\//g, "-")}_conclusao.pdf`;
    const filePath = `${dbOcc.id}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("occurrence-reports")
      .upload(filePath, pdfBlob, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) {
      console.error("Error uploading PDF:", error);
      return null;
    }

    // Store the file path (not URL) - we'll generate signed URLs when needed
    const { error: updateError } = await supabase
      .from("occurrences")
      .update({
        pdf_conclusao_url: filePath,
        pdf_gerado_em: new Date().toISOString(),
      })
      .eq("id", dbOcc.id);

    if (updateError) {
      console.error("Error updating occurrence with PDF URL:", updateError);
    }

    // Generate signed URL for immediate access
    const { data: signedData } = await supabase.storage
      .from("occurrence-reports")
      .createSignedUrl(filePath, 3600);

    return signedData?.signedUrl || null;
  } catch (error) {
    console.error("Error generating and storing PDF:", error);
    return null;
  }
}

export async function getOccurrencePdfUrl(occurrenceId: string): Promise<string | null> {
  const { data: occurrence, error } = await supabase
    .from("occurrences")
    .select("pdf_conclusao_url")
    .eq("id", occurrenceId)
    .single();

  if (error || !occurrence?.pdf_conclusao_url) {
    return null;
  }

  // Handle both old full URLs and new file paths
  let filePath = occurrence.pdf_conclusao_url;
  
  // If it's a full URL, extract the file path
  if (filePath.includes('/storage/v1/object/')) {
    const match = filePath.match(/occurrence-reports\/(.+)$/);
    if (match) {
      filePath = match[1];
    }
  }

  const { data } = await supabase.storage
    .from("occurrence-reports")
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  return data?.signedUrl || null;
}
