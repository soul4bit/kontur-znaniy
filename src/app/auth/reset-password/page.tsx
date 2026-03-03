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
            markClassName="border-[#6f98b4] bg-[#2b5873]"
            titleClassName="text-[#a6d8ee]"
            subtitleClassName="text-[#bdd7e8]"
          />

          <div className="mt-8">
            <DevopsShowcase
              minimal
              tone="reset"
              badge="Access Recovery"
              title="Обновите пароль и вернитесь к работе"
              description="Ссылка из письма открывает защищенную форму смены пароля. После сохранения вы сразу сможете войти в Контур Знаний с новыми данными."
              chips={["Password reset", "Mail token", "Security checks", "Audit trail"]}
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
