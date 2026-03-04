import { KeyRound, ShieldCheck, TimerReset, Waypoints } from "lucide-react";
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
    title: "Валидация ссылки",
    text: "Одноразовый токен проверяется перед изменением пароля.",
    icon: ShieldCheck,
  },
  {
    title: "Создание нового ключа",
    text: "Новый пароль становится главным ключом входа.",
    icon: KeyRound,
  },
  {
    title: "Возврат в атлас",
    text: "После сохранения можно сразу войти в рабочее пространство.",
    icon: Waypoints,
  },
  {
    title: "Повторный доступ",
    text: "Старые ссылки и токены больше не действуют.",
    icon: TimerReset,
  },
] as const;

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <main className="mx-auto grid w-full max-w-[1360px] gap-5 lg:grid-cols-[minmax(0,1.06fr)_minmax(440px,0.94fr)]">
        <section className="nook-shell rounded-3xl p-6 sm:p-8">
          <KnowledgeLogo subtitle="Knowledge Atlas: восстановление доступа" />

          <div className="mt-8 space-y-4">
            <span className="nook-kicker">маршрут восстановления</span>
            <h1 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
              Обновите пароль
              <br />
              и вернитесь на карту
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Ссылка из письма запускает защищенный маршрут восстановления. После смены пароля входите в
              систему как обычно.
            </p>
          </div>

          <section className="atlas-field mt-8 rounded-3xl p-5">
            <div className="relative z-10 grid gap-3 sm:grid-cols-2">
              {steps.map((item) => (
                <article key={item.title} className="atlas-node rounded-2xl p-4">
                  <div className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-primary/10 text-primary">
                    <item.icon className="size-4" />
                  </div>
                  <h2 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h2>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.text}</p>
                </article>
              ))}
            </div>
          </section>
        </section>

        <section className="nook-shell rounded-3xl p-6 sm:p-8">
          <ResetPasswordForm token={params.token ?? null} error={params.error ?? null} />
        </section>
      </main>
    </div>
  );
}
