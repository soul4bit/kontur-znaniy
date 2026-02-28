import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpenText, Clock3, List, Plus } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThoughtEditor } from "@/components/editor/thought-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth/session";

const notes = [
  {
    title: "Идеи для Nook",
    excerpt: "Сделать интерфейс спокойным, чтобы было удобно и писать, и перечитывать заметки.",
    time: "сейчас",
  },
  {
    title: "Утренние мысли",
    excerpt: "Собирать короткие записи без лишней структуры, а потом уже раскладывать по темам.",
    time: "вчера",
  },
  {
    title: "Что почитать",
    excerpt: "Список материалов и конспекты, к которым хочется вернуться позже.",
    time: "3 дня назад",
  },
];

export default async function AppPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/auth");
  }

  const displayName = session.user.name?.trim() || session.user.email;

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f7f8f4_0%,#edf3ef_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-[32px] border border-slate-200 bg-white/90 p-5 shadow-[0_20px_60px_rgba(39,70,63,0.07)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <span className="rounded-full border border-slate-200 bg-[#edf3ef] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
                Nook notes
              </span>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-balance text-slate-900 sm:text-4xl">
                  {displayName}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Здесь живут заметки, к которым ты возвращаешься не из обязанности, а потому что они продолжают работать на тебя.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                asChild
                className="rounded-2xl bg-[#2f7a67] px-5 text-white hover:bg-[#286857]"
              >
                <Link href="/app">
                  <Plus className="size-4" />
                  Новая заметка
                </Link>
              </Button>
              <SignOutButton />
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <Card className="rounded-[28px] border-slate-200 bg-white/90 shadow-[0_18px_50px_rgba(39,70,63,0.06)]">
              <CardHeader className="gap-3">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                  <List className="size-5 text-teal-700" />
                  Заметки
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Быстрый список того, что уже можно открыть и перечитать.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {notes.map((note, index) => (
                  <article
                  key={note.title}
                  className={`rounded-[22px] border px-4 py-4 ${
                    index === 0
                      ? "border-[#2f7a67] bg-[#2f7a67] text-white"
                      : "border-slate-200 bg-[#f4f7f4] text-slate-900"
                  }`}
                >
                  <div>
                    <h2 className="text-sm font-semibold">{note.title}</h2>
                    <p
                      className={`mt-2 text-sm leading-6 ${
                        index === 0 ? "text-white/85" : "text-slate-600"
                      }`}
                    >
                      {note.excerpt}
                      </p>
                    </div>
                    <div
                      className={`mt-3 flex items-center gap-2 text-xs ${
                        index === 0 ? "text-white/75" : "text-teal-700/70"
                      }`}
                    >
                      <Clock3 className="size-3.5" />
                      {note.time}
                    </div>
                  </article>
                ))}
              </CardContent>
            </Card>
          </aside>

          <section className="grid gap-6">
            <Card className="rounded-[32px] border-slate-200 bg-white/92 shadow-[0_24px_70px_rgba(39,70,63,0.08)]">
              <CardHeader className="gap-3 border-b border-slate-200 pb-6">
                <CardTitle className="text-2xl text-slate-900 sm:text-3xl">
                  Открытая заметка
                </CardTitle>
                <CardDescription className="max-w-2xl text-base leading-7 text-slate-600">
                  Здесь заметка должна звучать первой. Интерфейс только поддерживает чтение, но не вмешивается.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="rounded-[26px] border border-slate-200 bg-[#f5f8f5] p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-teal-700">
                    <BookOpenText className="size-4" />
                    Идеи для Nook
                  </div>
                  <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
                    <p>
                      Хорошие заметки не шумят. Они просто лежат рядом, ждут своего часа и в нужный момент снова становятся ясными.
                    </p>
                    <p>
                      Поэтому Nook строится как тихая рабочая поверхность: список слева, текст по центру, новый черновик сразу под рукой.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-slate-200 bg-white/92 shadow-[0_24px_70px_rgba(39,70,63,0.08)]">
              <CardHeader className="gap-3 border-b border-slate-200 pb-6">
                <CardTitle className="text-2xl text-slate-900 sm:text-3xl">
                  Новая заметка
                </CardTitle>
                <CardDescription className="max-w-2xl text-base leading-7 text-slate-600">
                  Новая запись начинается здесь. Быстро, спокойно и без лишних переходов между экранами.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ThoughtEditor />
              </CardContent>
            </Card>
          </section>
        </section>
      </main>
    </div>
  );
}

