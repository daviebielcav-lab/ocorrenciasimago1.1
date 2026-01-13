import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FileSearch, Paperclip, Check, ChevronsUpDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { OccurrenceFormData } from "@/types/occurrence";
import { AttachmentUpload, PendingFile } from "@/components/attachments/AttachmentUpload";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface RevisaoExameFormProps {
  form: UseFormReturn<OccurrenceFormData>;
  pendingFiles?: PendingFile[];
  onFilesChange?: (files: PendingFile[]) => void;
}

import { MEDICOS } from "@/constants/doctors";

// Lista de tipos de exame
const tiposExame = [
  { value: "ressonancia_magnetica", label: "Ressonância Magnética" },
  { value: "tomografia", label: "Tomografia" },
  { value: "raio_x", label: "Raio-X" },
  { value: "densitometria", label: "Densitometria" },
  { value: "mamografia", label: "Mamografia" },
  { value: "ultrassonografia", label: "Ultrassonografia" },
  { value: "pet_ct", label: "PET-CT" },
  { value: "angiografia", label: "Angiografia" },
  { value: "fluoroscopia", label: "Fluoroscopia" },
  { value: "medicina_nuclear", label: "Medicina Nuclear" },
  { value: "outro", label: "Outro" },
];

// Lista de regiões anatômicas
const regioesAnatomicas = [
  { value: "cranio", label: "Crânio" },
  { value: "face", label: "Face" },
  { value: "pescoco", label: "Pescoço" },
  { value: "coluna_cervical", label: "Coluna Cervical" },
  { value: "coluna_toracica", label: "Coluna Torácica" },
  { value: "coluna_lombar", label: "Coluna Lombar" },
  { value: "coluna_sacral", label: "Coluna Sacral" },
  { value: "torax", label: "Tórax" },
  { value: "mamas", label: "Mamas" },
  { value: "abdome_superior", label: "Abdome Superior" },
  { value: "abdome_inferior", label: "Abdome Inferior" },
  { value: "pelve", label: "Pelve" },
  { value: "ombro_direito", label: "Ombro Direito" },
  { value: "ombro_esquerdo", label: "Ombro Esquerdo" },
  { value: "braco_direito", label: "Braço Direito" },
  { value: "braco_esquerdo", label: "Braço Esquerdo" },
  { value: "cotovelo_direito", label: "Cotovelo Direito" },
  { value: "cotovelo_esquerdo", label: "Cotovelo Esquerdo" },
  { value: "antebraco_direito", label: "Antebraço Direito" },
  { value: "antebraco_esquerdo", label: "Antebraço Esquerdo" },
  { value: "punho_direito", label: "Punho Direito" },
  { value: "punho_esquerdo", label: "Punho Esquerdo" },
  { value: "mao_direita", label: "Mão Direita" },
  { value: "mao_esquerda", label: "Mão Esquerda" },
  { value: "quadril_direito", label: "Quadril Direito" },
  { value: "quadril_esquerdo", label: "Quadril Esquerdo" },
  { value: "coxa_direita", label: "Coxa Direita" },
  { value: "coxa_esquerda", label: "Coxa Esquerda" },
  { value: "joelho_direito", label: "Joelho Direito" },
  { value: "joelho_esquerdo", label: "Joelho Esquerdo" },
  { value: "perna_direita", label: "Perna Direita" },
  { value: "perna_esquerda", label: "Perna Esquerda" },
  { value: "tornozelo_direito", label: "Tornozelo Direito" },
  { value: "tornozelo_esquerdo", label: "Tornozelo Esquerdo" },
  { value: "pe_direito", label: "Pé Direito" },
  { value: "pe_esquerdo", label: "Pé Esquerdo" },
  { value: "corpo_inteiro", label: "Corpo Inteiro" },
  { value: "outro", label: "Outro" },
];

// Motivos de revisão
const motivosRevisao = [
  { value: "pedido_medico", label: "Pedido Médico" },
  { value: "auditoria_interna", label: "Auditoria Interna" },
  { value: "duvida_paciente", label: "Dúvida do Paciente" },
  { value: "erro_identificado", label: "Erro Identificado" },
  { value: "complemento_laudo", label: "Complemento de Laudo" },
  { value: "outro", label: "Outro" },
];

export function RevisaoExameForm({ form, pendingFiles = [], onFilesChange }: RevisaoExameFormProps) {
  const dados = (form.watch("dadosEspecificos") as any) || {};
  const [openTipoExame, setOpenTipoExame] = useState(false);
  const [openRegiao, setOpenRegiao] = useState(false);
  const [openMedico, setOpenMedico] = useState(false);

  const updateDados = (field: string, value: any) => {
    form.setValue("dadosEspecificos", {
      ...dados,
      [field]: value,
    });
  };

  const selectedTipoExame = tiposExame.find(t => t.value === dados.exameModalidade);
  const selectedRegiao = regioesAnatomicas.find(r => r.value === dados.exameRegiao);
  const selectedMedico = MEDICOS.find(m => m.id === dados.medicoResponsavelId);

  return (
    <div className="space-y-6">
      {/* Resumo do subtipo */}
      <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
        <div className="flex items-start gap-3">
          <FileSearch className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-purple-900">Revisão de Exame</h4>
            <p className="text-sm text-purple-700 mt-1">
              Registre detalhes sobre a revisão de laudo ou imagem após entrega.
            </p>
          </div>
        </div>
      </div>

      {/* Exame Revisado */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Exame Revisado</h3>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Tipo de Exame - Combobox com busca */}
          <div className="space-y-2">
            <FormLabel>Tipo de Exame</FormLabel>
            <Popover open={openTipoExame} onOpenChange={setOpenTipoExame}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openTipoExame}
                  className="w-full justify-between bg-background"
                >
                  {selectedTipoExame?.label || "Selecione o tipo de exame..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 z-50" align="start">
                <Command>
                  <CommandInput placeholder="Buscar tipo de exame..." />
                  <CommandList>
                    <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                    <CommandGroup>
                      {tiposExame.map((tipo) => (
                        <CommandItem
                          key={tipo.value}
                          value={tipo.label}
                          onSelect={() => {
                            updateDados("exameModalidade", tipo.value);
                            setOpenTipoExame(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              dados.exameModalidade === tipo.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {tipo.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Região Anatômica - Combobox com busca */}
          <div className="space-y-2">
            <FormLabel>Região Anatômica</FormLabel>
            <Popover open={openRegiao} onOpenChange={setOpenRegiao}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openRegiao}
                  className="w-full justify-between bg-background"
                >
                  {selectedRegiao?.label || "Selecione a região anatômica..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 z-50" align="start">
                <Command>
                  <CommandInput placeholder="Buscar região anatômica..." />
                  <CommandList>
                    <CommandEmpty>Nenhuma região encontrada.</CommandEmpty>
                    <CommandGroup>
                      {regioesAnatomicas.map((regiao) => (
                        <CommandItem
                          key={regiao.value}
                          value={regiao.label}
                          onSelect={() => {
                            updateDados("exameRegiao", regiao.value);
                            setOpenRegiao(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              dados.exameRegiao === regiao.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {regiao.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Data do exame */}
          <div className="space-y-2">
            <FormLabel>Data do exame</FormLabel>
            <Input
              type="date"
              value={dados.exameData || ""}
              onChange={(e) => updateDados("exameData", e.target.value)}
              className="bg-background"
            />
          </div>

          {/* Médico Responsável - Combobox com busca */}
          <div className="space-y-2">
            <FormLabel>Médico Responsável pelo Laudo</FormLabel>
            <Popover open={openMedico} onOpenChange={setOpenMedico}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openMedico}
                  className="w-full justify-between bg-background"
                >
                  {selectedMedico?.nome || "Selecione o médico..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 z-50" align="start">
                <Command>
                  <CommandInput placeholder="Buscar médico..." />
                  <CommandList>
                    <CommandEmpty>Nenhum médico encontrado.</CommandEmpty>
                    <CommandGroup>
                      {MEDICOS.map((medico) => (
                        <CommandItem
                          key={medico.id}
                          value={medico.nome}
                          onSelect={() => {
                            updateDados("medicoResponsavelId", medico.id);
                            updateDados("medicoResponsavel", medico.nome);
                            setOpenMedico(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              dados.medicoResponsavelId === medico.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {medico.nome}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Laudo já havia sido entregue? - Botões Sim/Não */}
        <div className="space-y-2">
          <FormLabel>O laudo já havia sido entregue?</FormLabel>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={dados.laudoEntregue === "sim" ? "default" : "outline"}
              className={cn(
                "flex-1",
                dados.laudoEntregue === "sim" && "bg-primary text-primary-foreground"
              )}
              onClick={() => updateDados("laudoEntregue", "sim")}
            >
              Sim
            </Button>
            <Button
              type="button"
              variant={dados.laudoEntregue === "nao" ? "default" : "outline"}
              className={cn(
                "flex-1",
                dados.laudoEntregue === "nao" && "bg-primary text-primary-foreground"
              )}
              onClick={() => updateDados("laudoEntregue", "nao")}
            >
              Não
            </Button>
          </div>
        </div>
      </div>

      {/* Motivo da Revisão - Botões */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Motivo da Revisão</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {motivosRevisao.map((motivo) => (
            <Button
              key={motivo.value}
              type="button"
              variant={dados.motivoRevisao === motivo.value ? "default" : "outline"}
              className={cn(
                "h-auto py-3 px-4 text-sm",
                dados.motivoRevisao === motivo.value && "bg-primary text-primary-foreground"
              )}
              onClick={() => updateDados("motivoRevisao", motivo.value)}
            >
              {motivo.label}
            </Button>
          ))}
        </div>

        {dados.motivoRevisao === "outro" && (
          <div className="space-y-2 mt-4">
            <FormLabel>Especifique o motivo</FormLabel>
            <Input
              placeholder="Descreva o motivo da revisão..."
              value={dados.motivoRevisaoOutro || ""}
              onChange={(e) => updateDados("motivoRevisaoOutro", e.target.value)}
              className="bg-background"
            />
          </div>
        )}
      </div>

      {/* Discrepância Encontrada */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Discrepância Encontrada</h3>

        <div className="space-y-2">
          <FormLabel>Tipo de discrepância</FormLabel>
          <Input
            placeholder="Ex: Achado ausente, Achado diferente, Lado errado, Medida incorreta..."
            value={dados.tipoDiscrepancia || ""}
            onChange={(e) => updateDados("tipoDiscrepancia", e.target.value)}
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <FormLabel>Potencial impacto clínico</FormLabel>
          <div className="flex gap-3">
            {["Nenhum", "Baixo", "Médio", "Alto"].map((nivel) => (
              <Button
                key={nivel}
                type="button"
                variant={dados.potencialImpacto === nivel.toLowerCase() ? "default" : "outline"}
                className={cn(
                  "flex-1",
                  dados.potencialImpacto === nivel.toLowerCase() && "bg-primary text-primary-foreground"
                )}
                onClick={() => updateDados("potencialImpacto", nivel.toLowerCase())}
              >
                {nivel}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <FormLabel>Descrição do impacto</FormLabel>
          <Textarea
            placeholder="Descreva o impacto potencial..."
            value={dados.impactoDescricao || ""}
            onChange={(e) => updateDados("impactoDescricao", e.target.value)}
            className="min-h-[80px] bg-background resize-none"
          />
        </div>
      </div>

      {/* Ação Tomada */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Ação Tomada/Planejada</h3>

        <div className="space-y-2">
          <FormLabel>Ações</FormLabel>
          <Textarea
            placeholder="Ex: Retificar laudo, Laudo complementar, Contatar médico solicitante..."
            value={dados.acaoTomada || ""}
            onChange={(e) => updateDados("acaoTomada", e.target.value)}
            className="min-h-[80px] bg-background resize-none"
          />
        </div>
      </div>

      {/* Pessoas Comunicadas */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Pessoas Comunicadas</h3>

        <div className="space-y-2">
          <FormLabel>Quem foi informado</FormLabel>
          <Textarea
            placeholder="Liste as pessoas comunicadas (tipo e nome)..."
            value={dados.pessoasComunicadas || ""}
            onChange={(e) => updateDados("pessoasComunicadas", e.target.value)}
            className="min-h-[80px] bg-background resize-none"
          />
        </div>
      </div>

      {/* Anexos - Somente para Revisão de Exame */}
      {onFilesChange && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Paperclip className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Anexos</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Anexe fotos ou documentos relevantes para esta revisão (imagens do exame, laudos, etc.)
          </p>
          <AttachmentUpload
            files={pendingFiles}
            onChange={onFilesChange}
            maxFiles={10}
          />
        </div>
      )}
    </div>
  );
}
