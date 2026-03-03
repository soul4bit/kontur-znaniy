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
            markClassName="border-[#6b95b0] bg-[#112437]"
            titleClassName="text-[#c6e5f7]"
            subtitleClassName="text-[#8fb1c9]"
          />

          <div className="relative z-10 mt-8 lg:mt-6">
            <DevopsShowcase
              minimal
              title="Единая база знаний по DevOps"
              description="Документация, runbook и статьи в одном месте. Доступы настраиваются по ролям, а материалы быстро обновляются и легко находятся через поиск."
              chips={["Runbook", "IaC", "CI/CD"]}
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
