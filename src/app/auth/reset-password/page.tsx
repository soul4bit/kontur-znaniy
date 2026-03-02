import { LockKeyhole, ShieldCheck } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { KnowledgeLogo } from "@/components/brand/knowledge-logo";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
    error?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;

  return (
    <div className="min-h-screen px-3 py-4 text-slate-100 sm:px-6 lg:px-8">
      <main className="nook-shell nook-reveal mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1560px] overflow-hidden rounded-[34px] lg:grid-cols-[1.08fr_minmax(420px,0.92fr)]">
        <section className="relative flex flex-col justify-between border-b border-slate-700/70 p-6 lg:border-b-0 lg:border-r lg:p-9 xl:p-11">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute -left-16 -top-20 h-64 w-64 rounded-full bg-[#3cc2a2]/25 blur-[84px]" />
            <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#5e8cf8]/20 blur-[96px]" />
          </div>

          <div className="relative">
            <KnowledgeLogo subtitle="Безопасное восстановление доступа" />
            <span className="nook-kicker mt-8">Password reset</span>
            <div className="mt-8 space-y-5">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-100 sm:text-5xl lg:text-6xl">
                Обновите пароль и вернитесь к работе.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                Ссылка из письма открывает защищенную форму смены пароля. После сохранения вы
                сможете сразу войти в Контур Знаний с новыми данными.
              </p>
            </div>
          </div>

          <div className="relative mt-9 grid gap-4 sm:grid-cols-2">
            <article className="nook-surface rounded-[22px] p-5">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#1c3550] text-[#79ebcf]">
                <LockKeyhole className="size-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-100">Одноразовая ссылка</h2>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Ссылка имеет ограниченный срок действия и защищает восстановление аккаунта от
                повторного использования.
              </p>
            </article>

            <article className="nook-surface rounded-[22px] p-5">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#1c3550] text-[#79ebcf]">
                <ShieldCheck className="size-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-100">Быстрый возврат</h2>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                После смены пароля вы возвращаетесь к экрану входа и продолжаете работу без
                дополнительной настройки.
              </p>
            </article>
          </div>
        </section>

        <section className="flex items-center p-4 sm:p-5 lg:p-8 xl:p-10">
          <ResetPasswordForm token={params.token ?? null} error={params.error ?? null} />
        </section>
      </main>
    </div>
  );
}
