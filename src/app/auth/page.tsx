import { redirect } from "next/navigation";
import { Database, Search, ShieldCheck, Sparkles, Workflow, Zap } from "lucide-react";
import { AuthForms } from "@/components/auth/auth-forms";
import { KnowledgeLogo } from "@/components/brand/knowledge-logo";
import { getCurrentSession } from "@/lib/auth/session";

const highlights = [
  {
    title: "Заметки не теряются в чатиках",
    text: "Runbook и инструкции лежат в базе, а не в потоке сообщений.",
    icon: Database,
  },
  {
    title: "Поиск работает по делу",
    text: "FTS находит решение по заголовку, описанию и содержимому статьи.",
    icon: Search,
  },
  {
    title: "Доступ под контролем",
    text: "Регистрация проходит через модерацию, а вход защищен guard-проверками.",
    icon: ShieldCheck,
  },
  {
    title: "Связный граф знаний",
    text: "Wiki-ссылки связывают заметки в рабочий контекст команды.",
    icon: Workflow,
  },
] as const;

const values = [
  {
    title: "Формат, который читает вся команда",
    text: "Одинаковая структура статьи помогает быстрее ориентироваться в runbook и ретро-заметках.",
  },
  {
    title: "Быстрый онбординг инженеров",
    text: "Новый участник проекта не ищет контекст по каналам, а открывает готовую карту решений.",
  },
] as const;

const stats = [
  { label: "Хранилище", value: "PostgreSQL" },
  { label: "Auth", value: "Better Auth + Guard" },
  { label: "Контент", value: "Статьи + Wiki связи" },
] as const;

export default async function AuthPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/app");
  }

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <main className="mx-auto grid w-full max-w-[1320px] gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(440px,0.92fr)]">
        <section className="nook-shell rounded-3xl p-6 sm:p-8">
          <KnowledgeLogo subtitle="Контур Знаний для DevOps-команды" />

          <div className="mt-8 space-y-4">
            <span className="nook-kicker">вики без офисной скуки</span>
            <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
              Контур Знаний
              <br />
              как единый рабочий ритм команды.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Не переписывайте одни и те же инструкции. Соберите статьи, runbook и контекст инцидентов в
              одну систему, которая реально используется каждый день.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {stats.map((item) => (
              <article key={item.label} className="nook-panel-soft rounded-2xl px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {highlights.map((item) => (
              <article key={item.title} className="nook-panel rounded-2xl p-4">
                <div className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-accent/45 text-foreground">
                  <item.icon className="size-4" />
                </div>
                <h2 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {values.map((item) => (
              <article key={item.title} className="nook-panel-soft rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground">
            <Zap className="size-3.5 text-primary" />
            <span>Один контур для решений, а не десятки разрозненных заметок</span>
            <Sparkles className="size-3.5 text-orange-500" />
          </div>
        </section>

        <section className="nook-shell rounded-3xl p-6 sm:p-8">
          <AuthForms />
        </section>
      </main>
    </div>
  );
}
