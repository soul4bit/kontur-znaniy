import { ArrowRight, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
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
      <main className="mx-auto grid w-full max-w-[1480px] gap-4 lg:grid-cols-[1.1fr_minmax(440px,0.9fr)]">
        <section className="nook-shell rounded-[32px] p-6 lg:p-9 xl:p-10">
          <KnowledgeLogo
            subtitle="Безопасное восстановление доступа"
            markClassName="border-[#3a6585] bg-[#102942]"
            titleClassName="text-[#a6d8ee]"
            subtitleClassName="text-[#7db0cc]"
          />

          <div className="mt-9 space-y-5">
            <span className="nook-kicker">
              <LockKeyhole className="size-3.5" />
              Password reset
            </span>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[#e8f4fd] sm:text-5xl lg:text-[3.35rem] lg:leading-[1.07]">
              Обновите пароль и вернитесь к работе.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-[#9dc0d7] sm:text-lg sm:leading-9">
              Ссылка из письма открывает защищенную форму смены пароля. После сохранения вы сразу
              сможете войти в Контур Знаний с новыми данными.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-[#2f5774] bg-[#102941]/80 p-5 shadow-[0_10px_24px_rgba(2,8,16,0.35)]">
              <div className="flex size-11 items-center justify-center rounded-xl bg-[#153853] text-[#8fd9f2]">
                <KeyRound className="size-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-[#e4f2fb]">Одноразовая ссылка</h2>
              <p className="mt-2 text-sm leading-7 text-[#94b8cf]">
                Ссылка действует ограниченное время и защищает восстановление от повторного
                использования.
              </p>
            </article>

            <article className="rounded-2xl border border-[#2f5774] bg-[#102941]/80 p-5 shadow-[0_10px_24px_rgba(2,8,16,0.35)]">
              <div className="flex size-11 items-center justify-center rounded-xl bg-[#113b42] text-[#7de5d2]">
                <ShieldCheck className="size-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-[#e4f2fb]">Безопасный возврат</h2>
              <p className="mt-2 text-sm leading-7 text-[#94b8cf]">
                После смены пароля вы возвращаетесь к стандартному входу без дополнительной
                настройки.
              </p>
            </article>
          </div>

          <div className="mt-8 rounded-2xl border border-[#2f5774] bg-[#102941]/80 p-5">
            <h2 className="text-sm font-semibold text-[#d9ebf8]">Как проходит восстановление</h2>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-[#98bbd1]">
              <li className="flex items-start gap-2.5">
                <ArrowRight className="mt-1 size-4 text-[#67d2f2]" />
                Открываете ссылку из письма и задаете новый пароль.
              </li>
              <li className="flex items-start gap-2.5">
                <ArrowRight className="mt-1 size-4 text-[#67d2f2]" />
                Система проверяет требования к паролю и сохраняет изменения.
              </li>
              <li className="flex items-start gap-2.5">
                <ArrowRight className="mt-1 size-4 text-[#67d2f2]" />
                Возвращаетесь на экран входа и продолжаете работу.
              </li>
            </ul>
          </div>
        </section>

        <section className="flex items-start lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:items-stretch">
          <ResetPasswordForm token={params.token ?? null} error={params.error ?? null} />
        </section>
      </main>
    </div>
  );
}
