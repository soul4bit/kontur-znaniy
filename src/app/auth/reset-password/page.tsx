import { KeyRound, ShieldCheck, TimerReset } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { KnowledgeLogo } from "@/components/brand/knowledge-logo";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
    error?: string;
  }>;
};

const steps = [
  {
    title: "Одноразовый токен",
    text: "Ссылка из письма работает ограниченное время и только один раз.",
    icon: ShieldCheck,
  },
  {
    title: "Новый пароль",
    text: "После сохранения вход выполняется с новым паролем.",
    icon: KeyRound,
  },
  {
    title: "Возврат в рабочий контур",
    text: "Сразу переходите обратно к статьям и runbook.",
    icon: TimerReset,
  },
] as const;

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <main className="mx-auto grid w-full max-w-[1320px] gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(440px,0.92fr)]">
        <section className="nook-shell rounded-3xl p-6 sm:p-8">
          <KnowledgeLogo subtitle="Контур Знаний: восстановление доступа" />

          <div className="mt-8 space-y-4">
            <span className="nook-kicker">безопасное восстановление</span>
            <h1 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
              Обновите пароль
              <br />
              и возвращайтесь к работе
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Восстановление устроено просто: открываете ссылку из письма, задаете новый пароль и
              возвращаетесь в Контур Знаний.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {steps.map((item, index) => (
              <article key={item.title} className={`nook-panel rounded-2xl p-4 ${index === 1 ? "sm:-translate-y-0.5" : ""}`}>
                <div className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-accent/45 text-foreground">
                  <item.icon className="size-4" />
                </div>
                <h2 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="nook-shell rounded-3xl p-6 sm:p-8">
          <ResetPasswordForm token={params.token ?? null} error={params.error ?? null} />
        </section>
      </main>
    </div>
  );
}
