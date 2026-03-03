import { type AuthFeedback } from "@/lib/auth/messages";

type FeedbackBannerProps = {
  feedback: AuthFeedback;
};

const toneClasses = {
  error: "border-destructive/55 bg-destructive/10 text-rose-200",
  success: "border-emerald-400/45 bg-emerald-500/10 text-emerald-200",
  info: "border-primary/55 bg-primary/10 text-sky-200",
} as const;

export function FeedbackBanner({ feedback }: FeedbackBannerProps) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm leading-6 ${toneClasses[feedback.tone]}`}>
      {feedback.text}
    </div>
  );
}
