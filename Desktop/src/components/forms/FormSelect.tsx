import * as React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormLabel } from "@/components/ui/form";

interface FormSelectProps {
  name: string;
  label?: string;
  placeholder?: string;
  options: { value: string; label: string }[] | string[];
  icon?: React.ReactNode;
  className?: string;
}

export function FormSelect({ 
  name, 
  label, 
  placeholder = "Selecione...",
  options,
  icon,
  className 
}: FormSelectProps) {
  const { setValue } = useFormContext();
  const value = useWatch({ name });
  
  const normalizedOptions = options.map((opt) => 
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const handleValueChange = React.useCallback((newValue: string) => {
    setValue(name, newValue, { shouldValidate: true });
  }, [name, setValue]);

  return (
    <div className={className}>
      {label && (
        <FormLabel className="flex items-center gap-2 mb-2">
          {icon}
          {label}
        </FormLabel>
      )}
      <Select 
        value={value || undefined} 
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="bg-background">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {normalizedOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
