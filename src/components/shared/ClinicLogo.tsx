type ClinicId = "indisa" | "clc" | "santa_maria" | "alemana";
type LogoSize = "sm" | "md" | "lg";

interface ClinicLogoProps {
  clinicId: ClinicId;
  size?: LogoSize;
}

const clinicConfig: Record<
  ClinicId,
  { label: string; letters: string; bg: string; text: string }
> = {
  indisa: { label: "Indisa", letters: "IN", bg: "bg-[#1e40af]", text: "text-white" },
  clc: { label: "CLC", letters: "CLC", bg: "bg-[#7c3aed]", text: "text-white" },
  santa_maria: { label: "Santa María", letters: "SM", bg: "bg-[#0d9488]", text: "text-white" },
  alemana: { label: "Alemana", letters: "CA", bg: "bg-[#dc2626]", text: "text-white" },
};

const sizeStyles: Record<LogoSize, string> = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-12 w-12 text-sm",
};

function ClinicLogo({ clinicId, size = "md" }: ClinicLogoProps) {
  const config = clinicConfig[clinicId];

  return (
    <div
      title={config.label}
      className={`inline-flex items-center justify-center rounded-lg font-bold ${config.bg} ${config.text} ${sizeStyles[size]}`}
    >
      {config.letters}
    </div>
  );
}

export { ClinicLogo };
export type { ClinicLogoProps };
