import { UseFormReturn } from "react-hook-form";
import { User, Phone, Hash, Calendar, Stethoscope, MapPin, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormSelect } from "@/components/forms/FormSelect";
import { OccurrenceFormData } from "@/types/occurrence";

interface PatientDataBlockProps {
  form: UseFormReturn<OccurrenceFormData>;
}

// Mock data - will come from tenant config
const unidades = [
  "Unidade Centro",
  "Unidade Norte",
  "Unidade Sul",
  "Unidade Leste",
];

const tiposExame = [
  "Raio-X",
  "Tomografia",
  "Ressonância Magnética",
  "Ultrassonografia",
  "Mamografia",
  "Densitometria",
  "PET-CT",
  "Outro",
];

export function PatientDataBlock({ form }: PatientDataBlockProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Dados do Paciente
          </h3>
          <p className="text-sm text-muted-foreground">
            Informações obrigatórias para rastreabilidade
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Nome Completo */}
        <FormField
          control={form.control}
          name="paciente.nomeCompleto"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Nome completo do paciente
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Digite o nome completo"
                  {...field}
                  className="bg-background"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Telefone */}
        <FormField
          control={form.control}
          name="paciente.telefone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Telefone
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="(00) 00000-0000"
                  {...field}
                  className="bg-background"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ID do Paciente */}
        <FormField
          control={form.control}
          name="paciente.idPaciente"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                ID do paciente
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Código ou prontuário"
                  {...field}
                  className="bg-background"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Data de Nascimento */}
        <FormField
          control={form.control}
          name="paciente.dataNascimento"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Data de nascimento
              </FormLabel>
              <FormControl>
                <Input type="date" {...field} className="bg-background" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tipo de Exame */}
        <FormSelect
          name="paciente.tipoExame"
          label="Tipo de exame realizado"
          placeholder="Selecione o exame"
          options={tiposExame}
          icon={<Stethoscope className="h-4 w-4 text-muted-foreground" />}
        />

        {/* Unidade/Local */}
        <FormSelect
          name="paciente.unidadeLocal"
          label="Unidade/Local"
          placeholder="Selecione a unidade"
          options={unidades}
          icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
        />

        {/* Data e Hora do Evento */}
        <FormField
          control={form.control}
          name="paciente.dataHoraEvento"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Data e hora do evento
              </FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  {...field}
                  className="bg-background"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
