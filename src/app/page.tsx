import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpenText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/app");
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f7f8f4_0%,#edf3ef_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4 rounded-[28px] border border-slate-200 bg-white/88 px-5 py-4 shadow-[0_18px_55px_rgba(39,70,63,0.08)] sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Nook</p>
            <p className="mt-1 text-sm text-slate-600">quiet notes for a clear mind</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              variant="ghost"
              className="rounded-2xl text-slate-900 hover:bg-[#e8efeb]"
            >
              <Link href="/auth?mode=sign-in">Войти</Link>
            </Button>
            <Button asChild className="rounded-2xl bg-[#2f7a67] px-5 text-white hover:bg-[#286857]">
              <Link href="/auth?mode=sign-up">
                Регистрация
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </header>

        <main className="grid flex-1 gap-6 lg:grid-cols-[1fr_minmax(0,0.98fr)] lg:items-center">
          <section className="space-y-7">
            <div className="space-y-5">
              <span className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700 shadow-sm">
                personal note space
              </span>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                  Nook это тихое место для заметок, к которым хочется возвращаться.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Поймал мысль, сохранил ее в несколько строк, потом открыл снова и увидел не шумный интерфейс, а спокойную страницу с текстом.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild className="h-11 rounded-2xl bg-[#2f7a67] px-6 text-white hover:bg-[#286857]">
                <Link href="/auth?mode=sign-in">
                  Открыть Nook
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-2xl border-slate-200 bg-white/80 px-6 text-slate-900 hover:bg-[#edf3ef]"
              >
                <Link href="/auth?mode=sign-up">Создать аккаунт</Link>
              </Button>
            </div>

            <div className="max-w-2xl rounded-[28px] border border-slate-200 bg-white/72 p-5 shadow-[0_14px_36px_rgba(39,70,63,0.05)] backdrop-blur">
              <p className="text-sm font-medium text-slate-900">Наш ритм</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Здесь мысли не должны бороться с интерфейсом. Nook нужен, чтобы быстро оставить след,
                а позже спокойно вернуться к нему, перечитать и продолжить без ощущения, что ты работаешь в админке.
              </p>
            </div>
          </section>

          <section>
            <div className="rounded-[34px] border border-slate-200 bg-white/92 p-5 shadow-[0_24px_80px_rgba(39,70,63,0.08)] sm:p-6">
              <div className="grid gap-4 md:grid-cols-[0.78fr_1.22fr]">
                <div className="rounded-[26px] border border-slate-200 bg-[#f4f7f4] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Заметки</p>
                  <div className="mt-4 space-y-2">
                    {[
                      "Идеи для Nook",
                      "Утренние записи",
                      "Конспект книги",
                      "Черновик статьи",
                    ].map((item, index) => (
                      <div
                        key={item}
                        className={`rounded-2xl px-3 py-3 text-sm ${
                          index === 0
                            ? "bg-[#2f7a67] text-white"
                            : "bg-white text-slate-900"
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[26px] border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-teal-700">
                    <BookOpenText className="size-4" />
                    Открытая заметка
                  </div>
                  <div className="mt-4 space-y-4">
                    <h2 className="text-2xl font-semibold text-slate-900">Идеи для Nook</h2>
                    <p className="text-sm leading-7 text-slate-600">
                      Хорошая заметка не просит внимания к интерфейсу. Она просто открывается, читается и снова становится полезной в нужный момент.
                    </p>
                    <p className="text-sm leading-7 text-slate-600">
                      Поэтому Nook строится вокруг одного честного сценария: записать, вернуться, перечитать, продолжить.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

