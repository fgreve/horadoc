type SkeletonVariant = "text" | "circle" | "card";

interface SkeletonProps {
  className?: string;
  variant?: SkeletonVariant;
}

const variantStyles: Record<SkeletonVariant, string> = {
  text: "h-4 w-full rounded",
  circle: "h-10 w-10 rounded-full",
  card: "h-32 w-full rounded-xl",
};

function Skeleton({ className = "", variant = "text" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-[#e7e5e4] ${variantStyles[variant]} ${className}`}
    />
  );
}

export { Skeleton };
export type { SkeletonProps };
