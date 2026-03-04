import Image from "next/image";
import { cn } from "@/lib/utils";

type KnowledgeLogoProps = {
  className?: string;
  markClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  subtitle?: string;
};

export function KnowledgeLogo({
  className,
  markClassName,
  titleClassName,
  subtitleClassName,
  subtitle = "системная база DevOps-знаний",
}: KnowledgeLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex h-12 w-16 items-center justify-center rounded-xl border border-border bg-card shadow-[0_6px_14px_rgba(33,28,21,0.12)]",
          markClassName
        )}
      >
        <Image
          src="/branding/logo-mark.svg"
          alt="Логотип Контур Знаний"
          width={48}
          height={36}
          className="h-8 w-12 object-contain"
          priority
        />
      </div>
      <div>
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.21em] text-foreground",
            titleClassName
          )}
        >
          Контур Знаний
        </p>
        <p className={cn("text-sm text-muted-foreground", subtitleClassName)}>{subtitle}</p>
      </div>
    </div>
  );
}
