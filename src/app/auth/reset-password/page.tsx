import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { DevopsShowcase } from "@/components/auth/devops-showcase";
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

          <div className="mt-8">
            <DevopsShowcase
              tone="reset"
              badge="Access Recovery"
              title="Обновите пароль и вернитесь к работе"
              description="Ссылка из письма открывает защищенную форму смены пароля. После сохранения вы сразу сможете войти в Контур Знаний с новыми данными."
              chips={["Password reset", "Mail token", "Security checks", "Audit trail"]}
              footer={
                <>
                  <article className="rounded-2xl border border-[#324e67] bg-[#0f1d2d]/76 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#84b6d2]">
                      Одноразовая ссылка
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[#acc4d6]">
                      Ссылка имеет ограниченный срок действия и защищает восстановление от повторного использования.
                    </p>
                  </article>
                  <article className="rounded-2xl border border-[#324e67] bg-[#0f1d2d]/76 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#84b6d2]">
                      Как проходит процесс
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm text-[#acc4d6]">
                      <li>Открываете ссылку из письма</li>
                      <li>Вводите и подтверждаете новый пароль</li>
                      <li>Возвращаетесь к обычному входу</li>
                    </ul>
                  </article>
                </>
              }
            />
          </div>
        </section>

        <section className="flex items-start lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:items-stretch">
          <ResetPasswordForm token={params.token ?? null} error={params.error ?? null} />
        </section>
      </main>
    </div>
  );
}
