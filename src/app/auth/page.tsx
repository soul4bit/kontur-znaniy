import { redirect } from "next/navigation";
import { AuthForms } from "@/components/auth/auth-forms";
import { DevopsShowcase } from "@/components/auth/devops-showcase";
import { KnowledgeLogo } from "@/components/brand/knowledge-logo";
import { getCurrentSession } from "@/lib/auth/session";

export default async function AuthPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/app");
  }

  return (
    <div className="min-h-screen px-3 py-4 text-slate-100 sm:px-6 lg:px-8">
      <main className="mx-auto grid w-full max-w-[1480px] gap-4 lg:grid-cols-[1.1fr_minmax(440px,0.9fr)]">
        <section className="nook-shell relative overflow-hidden rounded-[32px] p-6 lg:p-9 xl:p-10">
          <KnowledgeLogo
            subtitle="Приватная база знаний команды"
            className="relative z-10"
            markClassName="border-[#3f5f78] bg-[#112437]"
            titleClassName="text-[#c6e5f7]"
            subtitleClassName="text-[#8fb1c9]"
          />

          <div className="relative z-10 mt-8 lg:mt-6">
            <DevopsShowcase
              title="Единая база знаний по DevOps"
              description="Документация, runbook и статьи в одном месте. Доступы настраиваются по ролям, а материалы быстро обновляются и легко находятся через поиск."
              footer={
                <>
                  <article className="rounded-2xl border border-[#324e67] bg-[#0f1d2d]/76 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#84b6d2]">
                      Что внутри
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm text-[#acc4d6]">
                      <li>Runbook и операционные инструкции</li>
                      <li>Архитектурные схемы и интеграции</li>
                      <li>База знаний для onboarding</li>
                    </ul>
                  </article>

                  <article className="rounded-2xl border border-[#324e67] bg-[#0f1d2d]/76 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#84b6d2]">
                      Рабочий поток
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm text-[#acc4d6]">
                      <li>Завели материал в wiki</li>
                      <li>Обновили по итогам инцидента</li>
                      <li>Нашли за секунды через поиск</li>
                    </ul>
                  </article>
                </>
              }
            />
          </div>
        </section>

        <section className="flex items-start lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:items-stretch">
          <AuthForms />
        </section>
      </main>
    </div>
  );
}
