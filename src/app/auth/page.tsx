import { redirect } from "next/navigation";
import { BookOpenText, NotebookPen } from "lucide-react";
import { AuthForms } from "@/components/auth/auth-forms";
import { getCurrentSession } from "@/lib/auth/session";

export default async function AuthPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/app");
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f7f8f4_0%,#edf3ef_100%)] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <main className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.02fr_minmax(0,0.98fr)] lg:items-center">
        <section className="space-y-8">
          <div className="space-y-5">
            <span className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700 shadow-sm">
              nook access
            </span>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Вход в пространство, где мысли не теряются.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Один экран для входа, регистрации и возврата доступа. После авторизации ты сразу попадаешь к своим заметкам, без промежуточных витрин.
              </p>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white/88 p-5 shadow-[0_16px_40px_rgba(39,70,63,0.08)] sm:p-6">
            <div className="grid gap-4 sm:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[24px] border border-slate-200 bg-[#f4f7f4] p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-teal-700">
                  <NotebookPen className="size-4" />
                  Список заметок
                </div>
                <div className="mt-4 space-y-2">
                  {["Личный журнал", "Идеи", "Черновик текста"].map((item, index) => (
                    <div
                      key={item}
                      className={`rounded-2xl px-3 py-3 text-sm ${
                        index === 0 ? "bg-[#2f7a67] text-white" : "bg-white text-slate-900"
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-teal-700">
                  <BookOpenText className="size-4" />
                  Открытая заметка
                </div>
                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                  <p>Вход нужен не ради кабинета, а ради быстрого возвращения к своему тексту.</p>
                  <p>Точка входа в Nook должна ощущаться спокойно, как открытие записной книжки, а не как запуск панели управления.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <AuthForms />
      </main>
    </div>
  );
}

