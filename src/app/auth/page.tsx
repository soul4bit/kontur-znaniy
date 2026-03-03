import { redirect } from "next/navigation";
import {
  BookOpenText,
  LogIn,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  UserRoundPlus,
} from "lucide-react";
import { AuthForms } from "@/components/auth/auth-forms";
import { KnowledgeLogo } from "@/components/brand/knowledge-logo";
import { getCurrentSession } from "@/lib/auth/session";

export default async function AuthPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/app");
  }

  return (
    <div className="min-h-screen px-3 py-4 text-slate-900 sm:px-6 lg:px-8">
      <main className="mx-auto grid w-full max-w-[1480px] gap-4 lg:grid-cols-[1.1fr_minmax(440px,0.9fr)]">
        <section className="nook-shell relative overflow-hidden rounded-[32px] p-6 lg:p-9 xl:p-10">
          <div className="nook-auth-glow nook-auth-glow-primary" />
          <div className="nook-auth-glow nook-auth-glow-secondary" />

          <KnowledgeLogo subtitle="Защищенная база команды" />

          <div className="relative z-10 mt-9 space-y-5">
            <span className="nook-kicker">
              <Sparkles className="size-3.5" />
              Fast access
            </span>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.45rem] lg:leading-[1.05]">
              Вход и регистрация без лишнего текста.
            </h1>
            <p className="max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Просто выберите режим справа и продолжайте работу.
            </p>
          </div>

          <div className="relative z-10 mt-9 grid gap-4 lg:grid-cols-[1fr_232px]">
            <article className="nook-auth-stage">
              <div className="nook-auth-stage-ring nook-auth-float-slow" />
              <div className="nook-auth-stage-ring nook-auth-float-fast" />

              <div className="nook-auth-panel nook-auth-reveal-1">
                <div className="flex items-center justify-between">
                  <span className="nook-chip">Контур Знаний</span>
                  <BookOpenText className="size-4 text-sky-600" />
                </div>

                <div className="mt-5 space-y-3">
                  <div className="h-2 rounded-full bg-slate-200/90" />
                  <div className="h-2 w-10/12 rounded-full bg-slate-200/90" />
                  <div className="h-2 w-7/12 rounded-full bg-slate-200/90" />
                </div>

                <div className="mt-6 flex items-center gap-2.5">
                  <div className="size-2.5 rounded-full bg-emerald-400" />
                  <p className="text-xs font-medium text-slate-600">online workspace</p>
                </div>
              </div>

              <div className="nook-auth-floating-chip nook-auth-reveal-2">
                <LogIn className="size-3.5 text-emerald-600" />
                Вход
              </div>
              <div className="nook-auth-floating-chip nook-auth-floating-chip-right nook-auth-reveal-3">
                <UserRoundPlus className="size-3.5 text-sky-600" />
                Регистрация
              </div>
              <div className="nook-auth-floating-chip nook-auth-floating-chip-bottom nook-auth-reveal-4">
                <RefreshCcw className="size-3.5 text-amber-600" />
                Сброс пароля
              </div>
            </article>

            <div className="space-y-4">
              <article className="nook-auth-mini-card nook-auth-reveal-2">
                <div className="flex size-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <LogIn className="size-4" />
                </div>
                <h2 className="mt-3 text-sm font-semibold text-slate-900">Мгновенный вход</h2>
                <p className="mt-1 text-xs leading-6 text-slate-600">Минимум действий, максимум фокуса.</p>
              </article>

              <article className="nook-auth-mini-card nook-auth-reveal-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="size-4" />
                </div>
                <h2 className="mt-3 text-sm font-semibold text-slate-900">Защищенный доступ</h2>
                <p className="mt-1 text-xs leading-6 text-slate-600">Почта + модерация + контроль прав.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="flex items-start lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:items-stretch">
          <AuthForms />
        </section>
      </main>
    </div>
  );
}