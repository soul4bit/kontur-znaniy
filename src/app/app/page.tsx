import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookOpenText,
  Boxes,
  Cable,
  Clock3,
  FolderKanban,
  HardDriveUpload,
  Plus,
  ServerCog,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThoughtEditor } from "@/components/editor/thought-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth/session";
import { getArticleById, listArticlesByAuthor } from "@/lib/articles/server";
import { articleTopics } from "@/lib/content/devops-library";

const topicIcons = [ServerCog, Boxes, Cable, FolderKanban, HardDriveUpload, FolderKanban, HardDriveUpload];

type AppPageProps = {
  searchParams?: Promise<{
    article?: string;
  }>;
};

export default async function AppPage({ searchParams }: AppPageProps) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/auth");
  }

  const params = searchParams ? await searchParams : undefined;
  const selectedArticleId = params?.article;
  const articles = await listArticlesByAuthor(session.user.id);
  const selectedArticle =
    (selectedArticleId ? await getArticleById(session.user.id, selectedArticleId) : null) ??
    (articles[0] ? await getArticleById(session.user.id, articles[0].id) : null);

  const displayName = session.user.name?.trim() || session.user.email;
  const topicCounts = articleTopics.map((topic) => ({
    ...topic,
    count: articles.filter((article) => article.topic === topic.name).length,
  }));

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f7f8f4_0%,#edf3ef_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-[32px] border border-slate-200 bg-white/90 p-5 shadow-[0_20px_60px_rgba(39,70,63,0.07)] sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <span className="rounded-full border border-slate-200 bg-[#edf3ef] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
                DevOps notebook
              </span>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-balance text-slate-900 sm:text-4xl">
                  {displayName}
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                  Здесь будет личная база по Linux, Docker, сетям, Ansible, Kubernetes,
                  Terraform и CI/CD. Не wiki ради wiki, а рабочее место для заметок,
                  шпаргалок и статей, к которым реально возвращаются.
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
                  Новая статья
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
                <CardTitle className="text-lg text-slate-900">Направления</CardTitle>
                <CardDescription className="text-slate-600">
                  Блоки знаний, из которых будет собрана твоя личная DevOps-библиотека.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topicCounts.map((topic, index) => {
                  const Icon = topicIcons[index] ?? ServerCog;

                  return (
                    <article
                      key={topic.name}
                      className="rounded-[22px] border border-slate-200 bg-[#f4f7f4] px-4 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm">
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold text-slate-900">{topic.name}</h2>
                          <p className="mt-1 text-xs text-slate-500">{topic.count} статей</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{topic.summary}</p>
                    </article>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-slate-200 bg-white/90 shadow-[0_18px_50px_rgba(39,70,63,0.06)]">
              <CardHeader className="gap-3">
                <CardTitle className="text-lg text-slate-900">Хранение</CardTitle>
                <CardDescription className="text-slate-600">
                  Базовая схема хранения для этой версии Nook.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
                <div className="rounded-2xl border border-slate-200 bg-[#f4f7f4] px-4 py-3">
                  Статьи и метаданные: PostgreSQL
                </div>
                <div className="rounded-2xl border border-slate-200 bg-[#f4f7f4] px-4 py-3">
                  Картинки: отдельные файлы на сервере
                </div>
                <div className="rounded-2xl border border-slate-200 bg-[#f4f7f4] px-4 py-3">
                  В базе храним текст, HTML/JSON документа и путь к изображению
                </div>
              </CardContent>
            </Card>
          </aside>

          <section className="grid gap-6">
            <Card className="rounded-[32px] border-slate-200 bg-white/92 shadow-[0_24px_70px_rgba(39,70,63,0.08)]">
              <CardHeader className="gap-4 border-b border-slate-200 pb-6">
                <div className="flex flex-wrap items-center gap-2">
                  {articleTopics.map((topic) => (
                    <Badge
                      key={topic.name}
                      variant="outline"
                      className="rounded-full border-slate-200 bg-[#f4f7f4] px-3 py-1 text-slate-700"
                    >
                      {topic.name}
                    </Badge>
                  ))}
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl text-slate-900 sm:text-3xl">
                    Последние статьи
                  </CardTitle>
                  <CardDescription className="max-w-3xl text-base leading-7 text-slate-600">
                    Здесь уже показываются реальные статьи из базы. Открываешь нужную запись,
                    читаешь ее справа и редактируешь в том же экране.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
                {articles.length > 0 ? (
                  articles.map((article) => (
                    <Link key={article.id} href={`/app?article=${article.id}`}>
                      <article className="rounded-[26px] border border-slate-200 bg-[#f6f8f6] p-5 transition-colors hover:bg-[#eef4f0]">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="rounded-full bg-[#2f7a67] px-3 py-1 text-white">
                            {article.topic}
                          </Badge>
                        </div>
                        <h2 className="mt-4 text-xl font-semibold text-slate-900">{article.title}</h2>
                        <p className="mt-3 text-sm leading-7 text-slate-600">{article.summary}</p>
                        <div className="mt-4 flex items-center gap-2 text-xs text-teal-700/75">
                          <Clock3 className="size-3.5" />
                          обновлено {new Date(article.updatedAt).toLocaleDateString("ru-RU")}
                        </div>
                      </article>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-[26px] border border-dashed border-slate-300 bg-[#f6f8f6] p-6 text-sm leading-7 text-slate-600 md:col-span-2">
                    Пока нет ни одной статьи. Начни с первого разбора в редакторе ниже и сохрани его в базу.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-slate-200 bg-white/92 shadow-[0_24px_70px_rgba(39,70,63,0.08)]">
              <CardHeader className="gap-3 border-b border-slate-200 pb-6">
                {selectedArticle ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full bg-[#2f7a67] px-3 py-1 text-white">
                        {selectedArticle.topic}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl text-slate-900 sm:text-3xl">
                      {selectedArticle.title}
                    </CardTitle>
                    <CardDescription className="max-w-3xl text-base leading-7 text-slate-600">
                      {selectedArticle.summary}
                    </CardDescription>
                  </>
                ) : (
                  <>
                    <CardTitle className="text-2xl text-slate-900 sm:text-3xl">
                      Открытая статья
                    </CardTitle>
                    <CardDescription className="max-w-3xl text-base leading-7 text-slate-600">
                      Когда появится первая статья, здесь будет показан ее текст для чтения.
                    </CardDescription>
                  </>
                )}
              </CardHeader>
              <CardContent className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-5">
                  <div className="rounded-[26px] border border-slate-200 bg-[#f5f8f5] p-5">
                    <div className="flex items-center gap-2 text-sm font-medium text-teal-700">
                      <BookOpenText className="size-4" />
                      Тело статьи
                    </div>
                    <div
                      className="nook-editor mt-4 space-y-4 text-sm leading-7 text-slate-600"
                      dangerouslySetInnerHTML={{
                        __html:
                          selectedArticle?.contentHtml ??
                          "<p>Сохрани первую статью, и здесь появится ее содержимое.</p>",
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-[26px] border border-slate-200 bg-[#f5f8f5] p-5">
                  <p className="text-sm font-medium text-slate-900">Подсказка</p>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                      Сначала создай статью в редакторе ниже.
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                      После сохранения запись появится в списке и сразу откроется.
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                      Дальше можно вернуться к ней, отредактировать и снова сохранить.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-slate-200 bg-white/92 shadow-[0_24px_70px_rgba(39,70,63,0.08)]">
              <CardHeader className="gap-3 border-b border-slate-200 pb-6">
                <CardTitle className="text-2xl text-slate-900 sm:text-3xl">
                  Редактор статьи
                </CardTitle>
                <CardDescription className="max-w-3xl text-base leading-7 text-slate-600">
                  Этот редактор уже создает и сохраняет статьи в PostgreSQL. Если открыта
                  запись из списка выше, сохранение обновит именно ее.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ThoughtEditor
                  article={selectedArticle}
                  topics={articleTopics.map((topic) => topic.name)}
                />
              </CardContent>
            </Card>
          </section>
        </section>
      </main>
    </div>
  );
}