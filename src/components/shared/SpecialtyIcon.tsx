import {
  HeartPulse,
  ScanFace,
  Stethoscope,
  Baby,
  Activity,
  Brain,
  Apple,
  Eye,
  Ear,
  Smile,
  BrainCog,
  Bone,
  Scissors,
  ClipboardPlus,
  SmilePlus,
  Move,
  type LucideProps,
} from "lucide-react";
import { type FC } from "react";

interface SpecialtyIconProps {
  icon: string;
  className?: string;
}

const iconMap: Record<string, FC<LucideProps>> = {
  "heart-pulse": HeartPulse,
  "scan-face": ScanFace,
  stethoscope: Stethoscope,
  baby: Baby,
  activity: Activity,
  brain: Brain,
  apple: Apple,
  eye: Eye,
  ear: Ear,
  smile: Smile,
  "brain-cog": BrainCog,
  bone: Bone,
  scissors: Scissors,
  "clipboard-plus": ClipboardPlus,
  "smile-plus": SmilePlus,
  move: Move,
};

function SpecialtyIcon({ icon, className = "" }: SpecialtyIconProps) {
  const IconComponent = iconMap[icon];

  if (!IconComponent) {
    return <Stethoscope className={`h-5 w-5 text-[#14b8a6] ${className}`} />;
  }

  return <IconComponent className={`h-5 w-5 text-[#14b8a6] ${className}`} />;
}

export { SpecialtyIcon };
export type { SpecialtyIconProps };
