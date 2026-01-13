import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  ArrowRight, 
  Heart, 
  Briefcase, 
  Wrench,
  FileSearch,
  UserX,
  Droplets,
  PersonStanding,
  Receipt,
  CalendarX,
  Cpu,
  Server,
  Check
} from "lucide-react";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  OccurrenceType,
  OccurrenceSubtype,
  subtypeLabels,
  subtypeDescriptions,
  subtypesByType,
} from "@/types/occurrence";

// Type configurations - now includes revisao_exame as standalone type
const typeConfig: Record<OccurrenceType, {
  title: string;
  description: string;
  icon: typeof Heart;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverColor: string;
  disabled?: boolean;
  hidden?: boolean;
}> = {
  assistencial: {
    title: "Ocorrência Assistencial",
    description: "Eventos relacionados ao cuidado do paciente",
    icon: Heart,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    hoverColor: "hover:border-rose-400",
    hidden: true, // Hidden for now, will be enabled later
  },
  revisao_exame: {
    title: "Revisão de Exame",
    description: "Necessidade de revisão de laudo ou imagem",
    icon: FileSearch,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
    hoverColor: "hover:border-primary",
  },
  administrativa: {
    title: "Ocorrência Administrativa",
    description: "Problemas operacionais e de gestão",
    icon: Briefcase,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    hoverColor: "hover:border-amber-400",
    hidden: true, // Hidden for now, will be enabled later
  },
  tecnica: {
    title: "Ocorrência Técnica",
    description: "Falhas em equipamentos ou infraestrutura",
    icon: Wrench,
    color: "text-sky-600",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
    hoverColor: "hover:border-sky-400",
    hidden: true, // Hidden for now, will be enabled later
  },
};

// Only show types that are not hidden
const typeOrder: OccurrenceType[] = ["revisao_exame"];

// Subtype icons
const subtypeIcons: Record<OccurrenceSubtype, typeof Heart> = {
  erro_identificacao: UserX,
  extravasamento: Droplets,
  revisao_exame: FileSearch,
  quedas_traumas: PersonStanding,
  faturamento: Receipt,
  agendamento: CalendarX,
  equipamentos: Cpu,
  sistemas: Server,
};

export default function NovaOcorrenciaWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<OccurrenceType | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<OccurrenceSubtype | null>(null);

  const handleTypeSelect = (type: OccurrenceType) => {
    // For revisao_exame, go directly to form (no subtype selection needed)
    if (type === "revisao_exame") {
      navigate(`/ocorrencias/nova/assistencial/revisao_exame`);
      return;
    }
    setSelectedType(type);
    setSelectedSubtype(null);
    setStep(2);
  };

  const handleSubtypeSelect = (subtype: OccurrenceSubtype) => {
    setSelectedSubtype(subtype);
  };

  const handleContinue = () => {
    if (selectedType && selectedSubtype) {
      navigate(`/ocorrencias/nova/${selectedType}/${selectedSubtype}`);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedSubtype(null);
    } else {
      navigate("/");
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl animate-fade-in">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step === 2 ? "Voltar para tipos" : "Voltar ao Painel"}
        </Button>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
            step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {step > 1 ? <Check className="h-4 w-4" /> : "1"}
          </div>
          <div className={cn(
            "flex-1 h-1 rounded",
            step >= 2 ? "bg-primary" : "bg-muted"
          )} />
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
            step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            2
          </div>
          <div className="h-1 w-8 bg-muted rounded" />
          <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium bg-muted text-muted-foreground">
            3
          </div>
        </div>

        {/* Step 1: Select Type */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Selecione o tipo de ocorrência
              </h1>
              <p className="mt-2 text-muted-foreground">
                Escolha a categoria que melhor descreve o evento
              </p>
            </div>

            <div className="space-y-4">
              {typeOrder.map((type) => {
                const config = typeConfig[type];
                const Icon = config.icon;
                const isDisabled = config.disabled;
                return (
                  <Card
                    key={type}
                    className={cn(
                      "transition-all duration-200",
                      isDisabled 
                        ? "opacity-50 cursor-not-allowed" 
                        : cn("cursor-pointer", config.hoverColor),
                      config.borderColor,
                      selectedType === type && "ring-2 ring-primary"
                    )}
                    onClick={() => !isDisabled && handleTypeSelect(type)}
                  >
                    <CardContent className="flex items-center gap-4 p-6">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl",
                        config.bgColor
                      )}>
                        <Icon className={cn("h-6 w-6", config.color)} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {config.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {config.description}
                        </p>
                        {isDisabled && (
                          <span className="text-xs text-muted-foreground italic">
                            Em breve
                          </span>
                        )}
                      </div>
                      {!isDisabled && <ArrowRight className="h-5 w-5 text-muted-foreground" />}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Select Subtype */}
        {step === 2 && selectedType && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  typeConfig[selectedType].bgColor
                )}>
                  {(() => {
                    const Icon = typeConfig[selectedType].icon;
                    return <Icon className={cn("h-5 w-5", typeConfig[selectedType].color)} />;
                  })()}
                </div>
                <span className={cn(
                  "text-sm font-medium px-3 py-1 rounded-full",
                  typeConfig[selectedType].bgColor,
                  typeConfig[selectedType].color
                )}>
                  {typeConfig[selectedType].title}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Selecione o subtipo
              </h1>
              <p className="mt-2 text-muted-foreground">
                Cada subtipo possui um questionário específico
              </p>
            </div>

            <div className="space-y-3">
              {subtypesByType[selectedType].map((subtype) => {
                const Icon = subtypeIcons[subtype];
                const isSelected = selectedSubtype === subtype;
                return (
                  <Card
                    key={subtype}
                    className={cn(
                      "cursor-pointer transition-all duration-200 border-2",
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => handleSubtypeSelect(subtype)}
                  >
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-lg",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {subtypeLabels[subtype]}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {subtypeDescriptions[subtype]}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Continue Button */}
            <div className="flex justify-end pt-4">
              <Button
                size="lg"
                disabled={!selectedSubtype}
                onClick={handleContinue}
                className="min-w-[200px]"
              >
                Continuar para o formulário
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
