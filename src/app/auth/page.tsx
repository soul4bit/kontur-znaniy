import { redirect } from "next/navigation";
import { CheckCircle2, Database, Search, ShieldCheck } from "lucide-react";
import { AuthForms } from "@/components/auth/auth-forms";
import { KnowledgeLogo } from "@/components/brand/knowledge-logo";
import { getCurrentSession } from "@/lib/auth/session";

const checklist = [
  {
    title: "Приватная база знаний",
    text: "Все статьи и runbook хранятся в PostgreSQL и доступны только после авторизации.",
    icon: Database,
  },
  {
    title: "Поиск по содержимому",
    text: "FTS по заголовкам и тексту помогает быстро найти нужную заметку в рабочем потоке.",
    icon: Search,
  },
  {
    title: "Контроль доступа",
    text: "Регистрация проходит через модерацию, а попытки входа защищены guard-механизмом.",
    icon: ShieldCheck,
  },
] as const;

export default async function AuthPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/app");
  }

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <main className="mx-auto grid w-full max-w-[1240px] gap-5 lg:grid-cols-[1fr_minmax(420px,0.95fr)]">
        <section className="nook-shell rounded-2xl p-6 sm:p-8">
          <KnowledgeLogo subtitle="Приватная DevOps-вики для команды" />

          <div className="mt-8 space-y-4">
            <span className="nook-kicker">workspace</span>
            <h1 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
              Единое место для DevOps-заметок, решений и runbook
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Пишите статьи, связывайте материалы wiki-ссылками и держите рабочие инструкции в одном
              предсказуемом интерфейсе.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="nook-panel rounded-xl p-4 sm:col-span-2">
              <p className="text-sm text-muted-foreground">
                Доступ к базе знаний открывается после входа. Новый доступ создается через заявку и
                подтверждение email.
              </p>
            </div>
            {checklist.map((item) => (
              <article key={item.title} className="nook-panel rounded-xl p-4">
                <div className="inline-flex size-9 items-center justify-center rounded-lg bg-accent text-primary">
                  <item.icon className="size-4" />
                </div>
                <h2 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border/80 px-3 py-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-emerald-400" />
            PostgreSQL + Better Auth + редактор статей в одном контуре
          </div>
        </section>

        <section className="nook-shell rounded-2xl p-6 sm:p-8">
          <AuthForms />
        </section>
      </main>
    </div>
  );
}
