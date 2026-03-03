import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  Boxes,
  Cable,
  FolderKanban,
  HardDriveUpload,
  Plus,
  Search,
  ServerCog,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { WorkspacePanels } from "@/components/app/workspace-panels";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { KnowledgeLogo } from "@/components/brand/knowledge-logo";
import { UserAvatar } from "@/components/user/user-avatar";
import { Button } from "@/components/ui/button";
import { getCurrentSession, isAdminSession } from "@/lib/auth/session";
import {
  getArticleById,
  isArticleTopic,
  listArticles,
  searchArticles,
} from "@/lib/articles/server";
import { articleTopics, type ArticleTopic } from "@/lib/content/devops-library";

const copy = {
  newArticle: "Новая заметка",
  admin: "Админ-панель",
  sections: "Разделы",
  articlesSuffix: "статей",
  searchPlaceholder: "Поиск по заголовку, описанию и тексту",
  searchButton: "Найти",
  clearSearch: "Сброс",
  searchResult: "Результаты поиска",
} as const;

const topicIcons = {
  Linux: ServerCog,
  Docker: Boxes,
  "Сети": Cable,
  Ansible: FolderKanban,
  K8S: HardDriveUpload,
  Terraform: FolderKanban,
  "CI/CD": Sparkles,
} as const;

type AppPageProps = {
  searchParams?: Promise<{
    article?: string;
    topic?: string;
    category?: string;
    draft?: string;
    q?: string;
  }>;
};

function buildAppHref(
  topic: string,
  options?: {
    articleId?: string;
    draft?: boolean;
    category?: string;
    query?: string;
  }
) {
  const params = new URLSearchParams({ topic });

  if (options?.category) {
    params.set("category", options.category);
  }

  if (options?.articleId) {
    params.set("article", options.articleId);
  }

  if (options?.draft) {
    params.set("draft", "1");
  }

  if (options?.query?.trim()) {
    params.set("q", options.query.trim());
  }

  return `/app?${params.toString()}`;
}

export default async function AppPage({ searchParams }: AppPageProps) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/auth");
  }

  const params = searchParams ? await searchParams : undefined;
  const requestedTopic =
    params?.topic && isArticleTopic(params.topic) ? params.topic : null;
  const requestedCategory = params?.category?.trim() || null;
  const requestedArticleId = params?.article;
  const draftMode = params?.draft === "1";
  const searchQuery = params?.q?.trim().slice(0, 180) ?? "";
  const allArticles = await listArticles();
  const articles = searchQuery ? await searchArticles(searchQuery) : allArticles;
  const requestedArticle = requestedArticleId
    ? await getArticleById(requestedArticleId)
    : null;

  const selectedTopic = requestedArticle?.topic ?? requestedTopic ?? articleTopics[0].name;
  const topicArticles = articles.filter((article) => article.topic === selectedTopic);
  const topicCategoryMap = Object.fromEntries(
    articleTopics.map((topic) => [
      topic.name,
      Array.from(
        new Set([
          ...topic.categories,
          ...allArticles
            .filter((article) => article.topic === topic.name)
            .map((article) => article.category),
          "Общее",
        ])
      ),
    ])
  ) as Record<ArticleTopic, string[]>;
  const currentTopic =
    articleTopics.find((topic) => topic.name === selectedTopic) ?? articleTopics[0];
  const selectedCategory =
    requestedArticle?.category ??
    requestedCategory ??
    topicArticles[0]?.category ??
    currentTopic.categories[0] ??
    "Общее";
  const categoryArticles = topicArticles.filter(
    (article) => article.category === selectedCategory
  );
  const selectedArticleSummary = draftMode
    ? null
    : requestedArticle && requestedArticle.topic === selectedTopic
      ? requestedArticle
      : categoryArticles[0] ?? null;
  const selectedArticle =
    selectedArticleSummary &&
    (!requestedArticle || requestedArticle.id !== selectedArticleSummary.id)
      ? await getArticleById(selectedArticleSummary.id)
      : draftMode
        ? null
        : requestedArticle;

  const displayName = session.user.name?.trim() || session.user.email;
  const isAdmin = isAdminSession(session);
  const totalArticles = allArticles.length;
  const visibleArticlesCount = articles.length;
  const lastUpdatedAt = articles[0]?.updatedAt ?? null;
  const hasSearchQuery = Boolean(searchQuery);
  const seenSlugs = new Set<string>();
  const wikiLinks = allArticles
    .filter((article) => {
      if (seenSlugs.has(article.slug)) {
        return false;
      }

      seenSlugs.add(article.slug);
      return true;
    })
    .map((article) => ({
      slug: article.slug,
      title: article.title,
      href: buildAppHref(article.topic, {
        articleId: article.id,
        category: article.category,
      }),
    }));

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/88 shadow-[0_1px_0_rgba(148,163,184,0.18)] backdrop-blur-lg">
        <div className="mx-auto flex max-w-[1700px] flex-wrap items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3 lg:px-8">
          <Link href={buildAppHref(selectedTopic, { category: selectedCategory })}>
            <KnowledgeLogo
              subtitle="Командная база знаний"
              titleClassName="text-slate-700"
              subtitleClassName="text-slate-500"
              markClassName="border-slate-300 bg-slate-100 shadow-none"
            />
          </Link>

          <form
            action="/app"
            method="get"
            className="order-3 flex w-full items-center gap-2 md:order-none md:flex-1"
          >
            <input type="hidden" name="topic" value={selectedTopic} />
            <input type="hidden" name="category" value={selectedCategory} />
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                name="q"
                defaultValue={searchQuery}
                placeholder={copy.searchPlaceholder}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 sm:h-11"
              />
            </div>
            <button
              type="submit"
              className="h-10 rounded-xl bg-[#0f7aaf] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0d6997] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 sm:h-11"
            >
              {copy.searchButton}
            </button>
            {hasSearchQuery ? (
              <Link
                href={buildAppHref(selectedTopic, { category: selectedCategory })}
                className="hidden text-sm font-semibold text-sky-700 hover:underline md:inline"
              >
                {copy.clearSearch}
              </Link>
            ) : null}
          </form>

          <div className="ml-auto flex w-full items-center justify-end gap-2 sm:w-auto sm:justify-start">
            <Button asChild size="sm" className="h-9 rounded-lg bg-sky-600 hover:bg-sky-700">
              <Link
                href={buildAppHref(selectedTopic, {
                  draft: true,
                  category: selectedCategory,
                  query: searchQuery || undefined,
                })}
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">{copy.newArticle}</span>
              </Link>
            </Button>

            {isAdmin ? (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="hidden h-9 rounded-lg border-slate-300 bg-white text-slate-700 hover:bg-slate-100 md:inline-flex"
              >
                <Link href="/app/admin">
                  <ShieldCheck className="size-4" />
                  {copy.admin}
                </Link>
              </Button>
            ) : null}

            <SignOutButton className="h-9 rounded-lg border-slate-300 bg-white px-2.5 text-slate-700 hover:bg-slate-100 sm:px-3" />

            <Link
              href="/app/account"
              className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
              aria-label="Личный кабинет"
            >
              <UserAvatar
                image={session.user.image}
                name={displayName}
                className="size-9 rounded-lg border border-slate-300 bg-slate-100"
                fallbackClassName="text-sky-700"
              />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1700px] px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
        <details className="nook-surface group rounded-2xl">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{copy.sections}</p>
              <p className="text-xs text-slate-500">
                {selectedTopic} / {selectedCategory}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
              {hasSearchQuery ? `${visibleArticlesCount}/${totalArticles}` : totalArticles}{" "}
              {copy.articlesSuffix}
            </span>
          </summary>

          <div className="border-t border-slate-200 p-3">
            {hasSearchQuery ? (
              <div className="mb-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
                {copy.searchResult}: {visibleArticlesCount}
              </div>
            ) : null}

            <nav className="nook-scroll max-h-[52vh] space-y-2 overflow-y-auto pr-1">
              {articleTopics.map((topic) => {
                const Icon = topicIcons[topic.name];
                const isActive = topic.name === selectedTopic;
                const nestedArticles = articles.filter((article) => article.topic === topic.name);
                const nestedCategories = Array.from(
                  new Set([...topic.categories, ...nestedArticles.map((article) => article.category)])
                );

                return (
                  <article
                    key={topic.name}
                    className={`rounded-xl border ${
                      isActive ? "border-sky-300 bg-sky-50/60" : "border-slate-200 bg-white"
                    }`}
                  >
                    <Link
                      href={buildAppHref(topic.name, {
                        query: searchQuery || undefined,
                      })}
                      className="flex items-center gap-3 px-3 py-2.5"
                    >
                      <div
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                          isActive ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Icon className="size-4" />
                      </div>
                      <p className="text-sm font-medium text-slate-900">
                        {topic.name} <span className="text-slate-500">({nestedArticles.length})</span>
                      </p>
                    </Link>

                    {isActive ? (
                      <div className="space-y-2 border-t border-slate-200 px-3 py-2.5">
                        {nestedCategories.map((categoryName) => {
                          const groupedArticles = nestedArticles.filter(
                            (article) => article.category === categoryName
                          );
                          const isCategoryActive = categoryName === selectedCategory;

                          return (
                            <div key={categoryName} className="space-y-1.5">
                              <Link
                                href={buildAppHref(topic.name, {
                                  category: categoryName,
                                  query: searchQuery || undefined,
                                })}
                                className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-xs font-semibold ${
                                  isCategoryActive
                                    ? "bg-sky-100 text-sky-800"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                <span>{categoryName}</span>
                                <span>{groupedArticles.length}</span>
                              </Link>

                              {groupedArticles.map((article) => {
                                const isSelected = article.id === selectedArticle?.id;

                                return (
                                  <Link
                                    key={article.id}
                                    href={buildAppHref(topic.name, {
                                      articleId: article.id,
                                      category: categoryName,
                                      query: searchQuery || undefined,
                                    })}
                                    className={`flex items-start justify-between gap-2 rounded-lg px-2 py-2 text-sm ${
                                      isSelected ? "bg-sky-100 text-sky-900" : "hover:bg-slate-100"
                                    }`}
                                  >
                                    <span className="line-clamp-1">{article.title}</span>
                                    <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                                  </Link>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </nav>
          </div>
        </details>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_440px]">
          <WorkspacePanels
            selectedArticle={selectedArticle}
            selectedTopic={selectedTopic}
            selectedCategory={selectedCategory}
            topics={articleTopics.map((topic) => topic.name)}
            topicCategories={topicCategoryMap}
            totalArticles={totalArticles}
            lastUpdatedAt={lastUpdatedAt}
            isAdmin={isAdmin}
            currentUserId={session.user.id}
            wikiLinks={wikiLinks}
          />
        </div>
      </div>
    </div>
  );
}
