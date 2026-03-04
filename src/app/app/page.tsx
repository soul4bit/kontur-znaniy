import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3, Compass, Plus, Route, Search, ShieldCheck, Waypoints } from "lucide-react";
import { TopicSidebar } from "@/components/app/topic-sidebar";
import { WorkspacePanels } from "@/components/app/workspace-panels";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { KnowledgeLogo } from "@/components/brand/knowledge-logo";
import { UserAvatar } from "@/components/user/user-avatar";
import { Button } from "@/components/ui/button";
import {
  getArticleById,
  isArticleTopic,
  listArticles,
  searchArticles,
} from "@/lib/articles/server";
import { getUserArticleWriteAccess } from "@/lib/auth/article-permissions";
import { getCurrentSession, isAdminSession } from "@/lib/auth/session";
import { buildAppHref } from "@/lib/app/build-app-href";
import { articleTopics, type ArticleTopic } from "@/lib/content/devops-library";

type AppPageProps = {
  searchParams?: Promise<{
    article?: string;
    topic?: string;
    category?: string;
    draft?: string;
    edit?: string;
    q?: string;
  }>;
};

function formatHeaderDate(value: string | null) {
  if (!value) {
    return "нет данных";
  }

  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AppPage({ searchParams }: AppPageProps) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/auth");
  }

  const params = searchParams ? await searchParams : undefined;
  const requestedTopic = params?.topic && isArticleTopic(params.topic) ? params.topic : null;
  const requestedCategory = params?.category?.trim() || null;
  const requestedArticleId = params?.article;
  const draftMode = params?.draft === "1";
  const editModeRequested = params?.edit === "1";
  const searchQuery = params?.q?.trim().slice(0, 180) ?? "";

  const allArticles = await listArticles();
  const visibleArticles = searchQuery ? await searchArticles(searchQuery) : allArticles;
  const requestedArticle = requestedArticleId ? await getArticleById(requestedArticleId) : null;

  const selectedTopic = requestedArticle?.topic ?? requestedTopic ?? articleTopics[0].name;
  const topicArticles = visibleArticles.filter((article) => article.topic === selectedTopic);
  const currentTopic = articleTopics.find((topic) => topic.name === selectedTopic) ?? articleTopics[0];

  const selectedCategory =
    requestedArticle?.category ??
    requestedCategory ??
    topicArticles[0]?.category ??
    currentTopic.categories[0] ??
    "Общее";

  const categoryArticles = topicArticles.filter((article) => article.category === selectedCategory);
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

  const isEditMode = Boolean(selectedArticle && editModeRequested);
  const selectedArticleHref = selectedArticle
    ? buildAppHref(selectedArticle.topic, {
        articleId: selectedArticle.id,
        category: selectedArticle.category,
        query: searchQuery || undefined,
      })
    : null;
  const editArticleHref = selectedArticle
    ? buildAppHref(selectedArticle.topic, {
        articleId: selectedArticle.id,
        category: selectedArticle.category,
        query: searchQuery || undefined,
        edit: true,
      })
    : null;

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

  const displayName = session.user.name?.trim() || session.user.email;
  const isAdmin = isAdminSession(session);
  const canManageArticles = await getUserArticleWriteAccess(
    session.user.id,
    (session.user as { role?: unknown }).role
  );
  const lastUpdatedAt = visibleArticles[0]?.updatedAt ?? null;
  const hasSearchQuery = Boolean(searchQuery);
  const totalArticles = allArticles.length;
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
    <div className="min-h-screen px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1740px] flex-col gap-4">
        <header className="nook-shell sticky top-3 z-30 rounded-3xl p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link href={buildAppHref(selectedTopic, { category: selectedCategory })}>
              <KnowledgeLogo subtitle="knowledge atlas workspace" />
            </Link>

            <div className="ml-auto flex w-full items-center justify-end gap-2 sm:w-auto">
              {canManageArticles ? (
                <Button asChild size="sm" className="h-9">
                  <Link
                    href={buildAppHref(selectedTopic, {
                      draft: true,
                      category: selectedCategory,
                      query: searchQuery || undefined,
                    })}
                  >
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">Новый узел</span>
                  </Link>
                </Button>
              ) : null}

              {isAdmin ? (
                <Button asChild size="sm" variant="outline" className="hidden h-9 md:inline-flex">
                  <Link href="/app/admin">
                    <ShieldCheck className="size-4" />
                    Админ
                  </Link>
                </Button>
              ) : null}

              <SignOutButton className="h-9 rounded-lg border-border bg-card px-2.5 text-foreground hover:bg-muted sm:px-3" />

              <Link
                href="/app/account"
                className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                aria-label="Личный кабинет"
              >
                <UserAvatar
                  image={session.user.image}
                  name={displayName}
                  className="size-9 rounded-lg border border-border bg-card"
                  fallbackClassName="text-primary"
                />
              </Link>
            </div>
          </div>

          <div className="mt-3 grid gap-2 lg:grid-cols-[1fr_auto]">
            <div className="nook-panel-soft rounded-xl px-3 py-2.5 text-sm text-foreground">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.11em] text-muted-foreground">
                <Route className="size-3.5" />
                текущий маршрут
              </p>
              <p className="mt-1 font-semibold">
                {selectedTopic} / {selectedCategory}
                {selectedArticle ? ` / ${selectedArticle.title}` : ""}
              </p>
            </div>
            <div className="nook-panel-soft rounded-xl px-3 py-2.5 text-sm text-muted-foreground">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.11em]">
                <Clock3 className="size-3.5" />
                последнее обновление
              </p>
              <p className="mt-1 font-semibold text-foreground">{formatHeaderDate(lastUpdatedAt)}</p>
            </div>
          </div>

          <form action="/app" method="get" className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto]">
            <input type="hidden" name="topic" value={selectedTopic} />
            <input type="hidden" name="category" value={selectedCategory} />
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                name="q"
                defaultValue={searchQuery}
                placeholder="Поиск по узлам атласа: заголовок, описание, содержимое"
                className="h-11 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              />
            </div>
            <Button type="submit" className="h-11 px-4">
              Искать
            </Button>
            {hasSearchQuery ? (
              <Button asChild type="button" variant="outline" className="h-11 px-4">
                <Link href={buildAppHref(selectedTopic, { category: selectedCategory })}>Сбросить</Link>
              </Button>
            ) : null}
          </form>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-border bg-card/86 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Узлов всего</p>
              <p className="mt-1 text-base font-semibold text-foreground">{totalArticles}</p>
            </div>
            <div className="rounded-xl border border-border bg-card/86 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Узлов в выборке</p>
              <p className="mt-1 text-base font-semibold text-foreground">{visibleArticles.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card/86 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Активный раздел</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-base font-semibold text-foreground">
                <Compass className="size-4 text-primary" />
                {selectedTopic}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/86 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Режим</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-base font-semibold text-foreground">
                <Waypoints className="size-4 text-primary" />
                Knowledge Atlas
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)_390px]">
          <TopicSidebar
            allArticles={allArticles}
            visibleArticles={visibleArticles}
            selectedTopic={selectedTopic}
            selectedCategory={selectedCategory}
            selectedArticleId={selectedArticle?.id ?? null}
            searchQuery={searchQuery}
          />

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
            canManageArticles={canManageArticles}
            isEditMode={isEditMode}
            editArticleHref={editArticleHref}
            closeEditorHref={selectedArticleHref}
            wikiLinks={wikiLinks}
            visibleArticles={visibleArticles}
            searchQuery={searchQuery}
          />
        </div>
      </div>
    </div>
  );
}
