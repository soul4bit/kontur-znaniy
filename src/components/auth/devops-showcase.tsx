import { type ReactNode } from "react";
import {
  Activity,
  Box,
  CloudCog,
  GitBranch,
  KeyRound,
  Rocket,
  ServerCog,
  ShieldCheck,
} from "lucide-react";

type ShowcaseTone = "auth" | "reset";

type DevopsShowcaseProps = {
  title: string;
  description: string;
  tone?: ShowcaseTone;
  badge?: string;
  chips?: readonly string[];
  footer?: ReactNode;
};

const defaultChips = ["Runbooks", "Postmortem", "IaC", "CI/CD"] as const;

export function DevopsShowcase({
  title,
  description,
  tone = "auth",
  badge = "DevOps Knowledge Flow",
  chips = defaultChips,
  footer,
}: DevopsShowcaseProps) {
  const isReset = tone === "reset";

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-[#395773] bg-[#101f30]/82 p-5 shadow-[0_20px_44px_rgba(2,8,16,0.38)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#77b8d8]">{badge}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#e3f1fb]">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-[#9db9cb]">{description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span key={chip} className="nook-chip">
              {chip}
            </span>
          ))}
        </div>
      </div>

      <div className="nook-devops-stage">
        <div className="nook-devops-grid" />
        <div className="nook-devops-nebula nook-devops-nebula-a" />
        <div className="nook-devops-nebula nook-devops-nebula-b" />
        <div className="nook-devops-scan" />
        <div className="nook-devops-orbit nook-devops-orbit-a" />
        <div className="nook-devops-orbit nook-devops-orbit-b" />

        <div className="nook-devops-log">
          <p className="nook-devops-log-line nook-devops-log-line-1">git push main</p>
          <p className="nook-devops-log-line nook-devops-log-line-2">pipeline: lint + tests</p>
          <p className="nook-devops-log-line nook-devops-log-line-3">artifact: wiki-build</p>
          <p className="nook-devops-log-line nook-devops-log-line-4">
            {isReset ? "security: reset verified" : "deploy: knowledge updated"}
          </p>
        </div>

        <div className="nook-devops-status-strip">
          <span className="nook-devops-status-chip">
            <span className="nook-devops-status-dot" />
            CI green
          </span>
          <span className="nook-devops-status-chip nook-devops-status-chip-alt">
            {isReset ? "auth hardening" : "docs live"}
          </span>
        </div>

        <div className="nook-devops-core">
          {isReset ? <KeyRound className="size-6 text-[#fde68a]" /> : <ShieldCheck className="size-6 text-[#fde68a]" />}
        </div>

        <svg
          className="nook-devops-route"
          viewBox="0 0 1000 620"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            className="nook-devops-route-base"
            d="M60 442 H940"
          />
          <path
            className="nook-devops-route-glow"
            d="M60 442 H940"
          />
        </svg>

        <span className="nook-devops-traveler" />
        <span className="nook-devops-traveler nook-devops-traveler-secondary" />

        <div className="nook-devops-pipeline">
          <div className="nook-devops-node nook-devops-node-1">
            <GitBranch className="size-4" />
          </div>
          <div className="nook-devops-node nook-devops-node-2">
            <Box className="size-4" />
          </div>
          <div className="nook-devops-node nook-devops-node-3">
            <ShieldCheck className="size-4" />
          </div>
          <div className="nook-devops-node nook-devops-node-4">
            <ServerCog className="size-4" />
          </div>
          <div className="nook-devops-node nook-devops-node-5">
            <Rocket className="size-4" />
          </div>
        </div>

        <div className="nook-devops-steps">
          <span className="nook-devops-step nook-devops-step-1">commit</span>
          <span className="nook-devops-step nook-devops-step-2">build</span>
          <span className="nook-devops-step nook-devops-step-3">check</span>
          <span className="nook-devops-step nook-devops-step-4">release</span>
          <span className="nook-devops-step nook-devops-step-5">monitor</span>
        </div>

        <div className="nook-devops-float nook-devops-float-left">
          <CloudCog className="size-4 text-[#7cd9f3]" />
        </div>
        <div className="nook-devops-float nook-devops-float-right">
          <ServerCog className="size-4 text-[#9cd7f4]" />
        </div>
        <div className="nook-devops-float nook-devops-float-bottom">
          <Activity className="size-4 text-[#86efac]" />
        </div>
      </div>

      {footer ? (
        <div className="grid gap-3 sm:grid-cols-2">{footer}</div>
      ) : null}
    </div>
  );
}
