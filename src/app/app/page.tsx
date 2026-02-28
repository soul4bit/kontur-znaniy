import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BookOpenText,
  Boxes,
  Cable,
  Clock3,
  FolderKanban,
  HardDriveUpload,
  Plus,
  SearchSlash,
  ServerCog,
  Sparkles,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThoughtEditor } from "@/components/editor/thought-editor";
import { Button } from "@/components/ui/button";
import { getCurrentSession } from "@/lib/auth/session";
import {
  getArticleById,
  isArticleTopic,
  listArticlesByAuthor,
} from "@/lib/articles/server";
import { articleTopics } from "@/lib/content/devops-library";

const topicIcons = {
  Linux: ServerCog,
  Docker: Boxes,
  "\u0421\u0435\u0442\u0438": Cable,
  Ansible: FolderKanban,
  K8S: HardDriveUpload,
  Terraform: FolderKanban,
  "CI/CD": Sparkles,
} as const;

type AppPageProps = {
  searchParams?: Promise<{
    article?: string;
    topic?: string;
  }>;
};

function buildAppHref(topic: string, articleId?: string) {
  const params = new URLSearchParams({ topic });

  if (articleId) {
    params.set("article", articleId);
  }

  return `/app?${params.toString()}`;
}

export default async function AppPage({ searchParams }: AppPageProps) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/auth");
  }

  const params = searchParams ? await searchParams : undefined;
  const requestedTopic = params?.topic && isArticleTopic(params.topic) ? params.topic : null;
  const requestedArticleId = params?.article;
  const articles = await listArticlesByAuthor(session.user.id);
  const requestedArticle = requestedArticleId
    ? await getArticleById(session.user.id, requestedArticleId)
    : null;

  const selectedTopic =
    requestedArticle?.topic ?? requestedTopic ?? articleTopics[0].name;
  const topicArticles = articles.filter((article) => article.topic === selectedTopic);
  const activeArticleSummary =
    requestedArticle && requestedArticle.topic === selectedTopic
      ? requestedArticle
      : topicArticles[0] ?? null;
  const selectedArticle =
    activeArticleSummary &&
    (!requestedArticle || requestedArticle.id !== activeArticleSummary.id)
      ? await getArticleById(session.user.id, activeArticleSummary.id)
      : requestedArticle;

  const currentTopic =
    articleTopics.find((topic) => topic.name === selectedTopic) ?? articleTopics[0];
  const displayName = session.user.name?.trim() || session.user.email;
  const totalArticles = articles.length;

  return (
    <div className="min-h-screen bg-[#121514] px-4 py-4 text-[#f3f7f4] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1600px] flex-col overflow-hidden rounded-[36px] border border-[#29312d] bg-[radial-gradient(circle_at_top_left,rgba(83,230,166,0.18),transparent_26%),linear-gradient(180deg,#181c1a_0%,#111413_100%)] shadow-[0_30px_120px_rgba(0,0,0,0.45)] lg:flex-row">
        <aside className="flex w-full flex-col border-b border-[#29312d] bg-[#141816]/95 p-5 lg:max-w-[320px] lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-16 items-center justify-center overflow-hidden rounded-[18px] border border-[#31413a] bg-[#0f1311]">
                <div className="absolute left-2 h-3 w-2 rounded-full bg-[#53e6a6]" />
                <div className="absolute left-5 top-3 h-6 w-4 rounded-l-[18px] rounded-r-[6px] bg-[#53e6a6]" />
                <div className="absolute left-7 top-2 h-8 w-3 rotate-[32deg] rounded-full bg-[#53e6a6]" />
                <div className="absolute right-5 top-3 h-6 w-4 rounded-l-[6px] rounded-r-[18px] bg-[#53e6a6]" />
                <div className="absolute right-2 h-3 w-2 rounded-full bg-[#53e6a6]" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-[#6d8379]">
                  Nook
                </p>
                <p className="text-sm text-[#d7e2dc]">DevOps knowledge base</p>
              </div>
            </div>

            <SignOutButton className="border-[#2b3531] bg-[#181e1b] text-[#dce7e1] hover:bg-[#1c2320]" />
          </div>

          <div className="mt-8 rounded-[28px] border border-[#29312d] bg-[#171c19] p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#6d8379]">
              Workspace
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              {displayName}
            </h1>
            <p className="mt-3 text-sm leading-7 text-[#90a69d]">
              Тихая база знаний по Linux, Docker, сетям, Ansible, Kubernetes,
              Terraform и CI/CD. Слева разделы, внутри статьи, справа чтение и
              редактор.
            </p>

            <Button
              asChild
              className="mt-5 h-11 w-full rounded-2xl bg-[#53e6a6] text-[#0c1511] hover:bg-[#47cf95]"
            >
              <Link href={buildAppHref(selectedTopic)}>
                <Plus className="size-4" />
                Новая статья
              </Link>
            </Button>
          </div>

          <div className="mt-6 flex-1 overflow-y-auto pr-1">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-[#6d8379]">
                Разделы
              </p>
              <span className="rounded-full border border-[#2b3531] px-2.5 py-1 text-xs text-[#a4bab1]">
                {totalArticles} статей
              </span>
            </div>

            <nav className="space-y-3">
              {articleTopics.map((topic) => {
                const Icon = topicIcons[topic.name];
                const isActive = topic.name === selectedTopic;
                const nestedArticles = articles.filter(
                  (article) => article.topic === topic.name
                );

                return (
                  <div
                    key={topic.name}
                    className={`rounded-[24px] border transition-colors ${
                      isActive
                        ? "border-[#53e6a6]/30 bg-[#1c2622]"
                        : "border-[#29312d] bg-[#171c19]"
                    }`}
                  >
                    <Link
                      href={buildAppHref(topic.name)}
                      className="flex items-start gap-3 px-4 py-4"
                    >
                      <div
                        className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl ${
                          isActive
                            ? "bg-[#53e6a6] text-[#09120e]"
                            : "bg-[#111513] text-[#8ba198]"
                        }`}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-semibold text-white">
                            {topic.name}
                          </h2>
                          <span className="text-xs text-[#7f948b]">
                            {nestedArticles.length}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-[#8fa59c]">
                          {topic.summary}
                        </p>
                      </div>
                    </Link>

                    {isActive ? (
                      <div className="border-t border-[#29312d] px-3 py-3">
                        {nestedArticles.length > 0 ? (
                          <div className="space-y-2">
                            {nestedArticles.map((article) => {
                              const isSelected = article.id === selectedArticle?.id;

                              return (
                                <Link
                                  key={article.id}
                                  href={buildAppHref(topic.name, article.id)}
                                  className={`block rounded-2xl px-3 py-3 transition-colors ${
                                    isSelected
                                      ? "bg-[#53e6a6] text-[#0b1510]"
                                      : "bg-[#111513] text-[#dce6e0] hover:bg-[#1a201d]"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium">
                                        {article.title}
                                      </p>
                                      <p
                                        className={`mt-1 line-clamp-2 text-xs leading-5 ${
                                          isSelected
                                            ? "text-[#183226]"
                                            : "text-[#88a096]"
                                        }`}
                                      >
                                        {article.summary}
                                      </p>
                                    </div>
                                    <ArrowUpRight className="mt-0.5 size-3.5 shrink-0" />
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-[#314039] px-3 py-4 text-sm leading-6 text-[#7e948a]">
                            В этом разделе пока нет статей. Создай первую заметку
                            в редакторе справа.
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-6 p-5 lg:p-6">
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="rounded-[32px] border border-[#29312d] bg-[#171c19] p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#6d8379]">
                Сейчас открыт раздел
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex rounded-full bg-[#53e6a6] px-3 py-1 text-sm font-medium text-[#0a1410]">
                  {currentTopic.name}
                </span>
                <span className="text-sm text-[#8fa59c]">
                  {topicArticles.length} статей в разделе
                </span>
              </div>
              <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-[2.5rem]">
                Nook хранит заметки так, чтобы их было удобно перечитывать.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#8fa59c] sm:text-base">
                Открываешь раздел, видишь список материалов по теме, выбираешь
                статью и сразу читаешь её рядом. Это не перегруженная wiki, а
                личная техническая база, к которой удобно возвращаться.
              </p>
            </div>

            <div className="rounded-[32px] border border-[#29312d] bg-[#171c19] p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#6d8379]">
                Срез
              </p>
              <div className="mt-5 grid gap-3">
                <div className="rounded-[24px] border border-[#29312d] bg-[#111513] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#6d8379]">
                    Все статьи
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {totalArticles}
                  </p>
                </div>
                <div className="rounded-[24px] border border-[#29312d] bg-[#111513] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#6d8379]">
                    Последнее обновление
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {articles[0]
                      ? new Date(articles[0].updatedAt).toLocaleDateString("ru-RU")
                      : "Пока пусто"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid min-h-0 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="rounded-[32px] border border-[#29312d] bg-[#171c19] p-6">
              {selectedArticle ? (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex rounded-full bg-[#53e6a6] px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[#0a1410]">
                      {selectedArticle.topic}
                    </span>
                    <span className="inline-flex items-center gap-2 text-xs text-[#7f948b]">
                      <Clock3 className="size-3.5" />
                      Обновлено{" "}
                      {new Date(selectedArticle.updatedAt).toLocaleDateString("ru-RU")}
                    </span>
                  </div>

                  <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white">
                    {selectedArticle.title}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[#8fa59c] sm:text-base">
                    {selectedArticle.summary}
                  </p>

                  <div className="mt-6 rounded-[28px] border border-[#29312d] bg-[#111513] p-5">
                    <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[#b8c9c1]">
                      <BookOpenText className="size-4 text-[#53e6a6]" />
                      Чтение статьи
                    </div>
                    <article
                      className="nook-editor prose-invert max-w-none space-y-4 text-sm leading-7 text-[#d9e4de]"
                      dangerouslySetInnerHTML={{ __html: selectedArticle.contentHtml }}
                    />
                  </div>
                </>
              ) : (
                <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-dashed border-[#314039] bg-[#111513] px-8 text-center">
                  <div className="flex size-14 items-center justify-center rounded-3xl bg-[#1c2622] text-[#53e6a6]">
                    <SearchSlash className="size-6" />
                  </div>
                  <h2 className="mt-5 text-2xl font-semibold text-white">
                    В разделе пока нечего читать
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-7 text-[#8fa59c]">
                    Выбери другой раздел со статьями или создай первую заметку по
                    теме {currentTopic.name} в редакторе.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-[32px] border border-[#29312d] bg-[#171c19] p-6">
              <div className="mb-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#6d8379]">
                  Редактор
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  {selectedArticle ? "Редактирование статьи" : "Новая заметка"}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#8fa59c]">
                  Создай статью в нужном разделе, сохрани её в PostgreSQL и она
                  сразу появится слева в списке.
                </p>
              </div>

              <ThoughtEditor
                article={selectedArticle}
                topics={articleTopics.map((topic) => topic.name)}
                defaultTopic={selectedTopic}
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
