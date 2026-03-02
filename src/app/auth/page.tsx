import { redirect } from "next/navigation";
import { BookOpenText, Clock3, NotebookTabs, ShieldCheck } from "lucide-react";
import { AuthForms } from "@/components/auth/auth-forms";
import { KnowledgeLogo } from "@/components/brand/knowledge-logo";
import { getCurrentSession } from "@/lib/auth/session";

export default async function AuthPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/app");
  }

  return (
    <div className="min-h-screen px-3 py-4 text-slate-100 sm:px-6 lg:px-8">
      <main className="nook-shell nook-reveal mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1560px] overflow-hidden rounded-[34px] lg:grid-cols-[1.08fr_minmax(420px,0.92fr)]">
        <section className="relative flex flex-col justify-between border-b border-slate-700/70 p-6 lg:border-b-0 lg:border-r lg:p-9 xl:p-11">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute -left-16 -top-20 h-64 w-64 rounded-full bg-[#3cc2a2]/25 blur-[84px]" />
            <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#5e8cf8]/20 blur-[96px]" />
          </div>

          <div className="relative">
            <KnowledgeLogo subtitle="Приватная рабочая база команды" />

            <div className="mt-10 space-y-5">
              <span className="nook-kicker">One flow login</span>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-100 sm:text-5xl lg:text-6xl">
                Быстрый вход без лишних шагов.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                Единый экран для входа, регистрации и восстановления пароля. После авторизации вы
                сразу попадаете в рабочую зону со статьями.
              </p>
            </div>
          </div>

          <div className="relative mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <article className="nook-surface rounded-[22px] p-5">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#1c3550] text-[#79ebcf]">
                <NotebookTabs className="size-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-100">Четкая структура</h2>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Темы, категории и статьи организованы так, чтобы информация искалась быстрее.
              </p>
            </article>

            <article className="nook-surface rounded-[22px] p-5">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#1c3550] text-[#79ebcf]">
                <BookOpenText className="size-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-100">Редактирование рядом</h2>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Просмотр статьи и редактор находятся в одном пространстве без переключений.
              </p>
            </article>

            <article className="nook-surface rounded-[22px] p-5 md:col-span-2 xl:col-span-1">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#1c3550] text-[#79ebcf]">
                <ShieldCheck className="size-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-100">Безопасный доступ</h2>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Заявки на регистрацию и подтверждение почты проходят модерацию администратора.
              </p>
            </article>
          </div>

          <div className="relative mt-8 nook-surface-soft rounded-[20px] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <Clock3 className="size-4 text-[#79ebcf]" />
              Вход обычно занимает меньше минуты
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Под рукой три режима: вход, регистрация и сброс пароля. Нужное действие выбирается
              сразу в форме справа.
            </p>
          </div>
        </section>

        <section className="flex items-center p-4 sm:p-5 lg:p-8 xl:p-10">
          <AuthForms />
        </section>
      </main>
    </div>
  );
}
