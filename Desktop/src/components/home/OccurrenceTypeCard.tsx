import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LucideIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { subtypesByType, subtypeLabels, OccurrenceSubtype } from "@/types/occurrence";

interface OccurrenceTypeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  type: "assistencial" | "administrativa" | "tecnica";
}

const typeStyles = {
  assistencial: {
    iconBg: "bg-occurrence-assistencial/10",
    iconColor: "text-occurrence-assistencial",
    badge: "Paciente & Cuidado",
  },
  administrativa: {
    iconBg: "bg-occurrence-administrativa/10",
    iconColor: "text-occurrence-administrativa",
    badge: "Gestão & Processos",
  },
  tecnica: {
    iconBg: "bg-occurrence-tecnica/10",
    iconColor: "text-occurrence-tecnica",
    badge: "Equipamentos & Infraestrutura",
  },
};

export function OccurrenceTypeCard({ title, description, icon: Icon, type }: OccurrenceTypeCardProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const styles = typeStyles[type];
  const subtypes = subtypesByType[type];

  const handleSubtypeClick = (subtype: string) => {
    navigate(`/ocorrencias/nova?tipo=${type}&subtipo=${subtype}`);
  };

  return (
    <div className={cn("occurrence-card w-full text-left", type)}>
      {/* Header clicável */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start gap-4 cursor-pointer"
      >
        <div className={cn("rounded-xl p-3 transition-transform", styles.iconBg, isExpanded && "scale-110")}>
          <Icon className={cn("h-6 w-6", styles.iconColor)} />
        </div>
        
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-card-foreground">
              {title}
            </h3>
          </div>
          
          <span className={cn(
            "inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2",
            styles.iconBg,
            styles.iconColor
          )}>
            {styles.badge}
          </span>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        <div className={cn(
          "flex items-center justify-center h-10 w-10 rounded-full bg-secondary transition-transform",
          isExpanded && "rotate-180"
        )}>
          <ChevronDown className="h-5 w-5 text-foreground" />
        </div>
      </button>

      {/* Subtipos expandidos */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border animate-fade-in">
          <p className="text-xs text-muted-foreground mb-3">Selecione o subtipo:</p>
          <div className="flex flex-wrap gap-2">
            {subtypes.map((subtype) => (
              <button
                key={subtype}
                onClick={() => handleSubtypeClick(subtype)}
                className="text-sm px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
              >
                {subtypeLabels[subtype as OccurrenceSubtype]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
