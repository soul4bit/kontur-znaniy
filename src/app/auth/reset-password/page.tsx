import { KeyRound, ShieldCheck } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { KnowledgeLogo } from "@/components/brand/knowledge-logo";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
    error?: string;
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <main className="mx-auto grid w-full max-w-[1240px] gap-5 lg:grid-cols-[1fr_minmax(420px,0.95fr)]">
        <section className="nook-shell rounded-2xl p-6 sm:p-8">
          <KnowledgeLogo subtitle="Безопасное восстановление доступа" />

          <div className="mt-8 space-y-4">
            <span className="nook-kicker">recovery</span>
            <h1 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
              Обновите пароль и вернитесь к рабочим заметкам
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Ссылка из письма открывает одноразовую форму смены пароля. После сохранения вы сможете
              снова войти через стандартный экран авторизации.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <article className="nook-panel rounded-xl p-4">
              <div className="inline-flex size-9 items-center justify-center rounded-lg bg-accent text-primary">
                <ShieldCheck className="size-4" />
              </div>
              <h2 className="mt-3 text-sm font-semibold text-foreground">Одноразовый токен</h2>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                Сброс работает только по валидной ссылке из письма и ограничен по времени.
              </p>
            </article>
            <article className="nook-panel rounded-xl p-4">
              <div className="inline-flex size-9 items-center justify-center rounded-lg bg-accent text-primary">
                <KeyRound className="size-4" />
              </div>
              <h2 className="mt-3 text-sm font-semibold text-foreground">Новый пароль</h2>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                Установите новый пароль и используйте его для следующего входа в систему.
              </p>
            </article>
          </div>
        </section>

        <section className="nook-shell rounded-2xl p-6 sm:p-8">
          <ResetPasswordForm token={params.token ?? null} error={params.error ?? null} />
        </section>
      </main>
    </div>
  );
}
