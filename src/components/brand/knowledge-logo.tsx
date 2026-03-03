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
  subtitle = "Контур Знаний",
}: KnowledgeLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex h-12 w-16 items-center justify-center rounded-[14px] border border-[#37556e] bg-[#13293d] shadow-[0_10px_22px_rgba(2,8,16,0.34)]",
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
            "text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c7e5f6]",
            titleClassName
          )}
        >
          Контур Знаний
        </p>
        <p className={cn("text-sm text-[#96b4c8]", subtitleClassName)}>{subtitle}</p>
      </div>
    </div>
  );
}
