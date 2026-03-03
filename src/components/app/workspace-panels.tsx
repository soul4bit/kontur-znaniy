"use client";

import Link from "next/link";
import { BookOpenText, Clock3, PenSquare, UserRound } from "lucide-react";
import { ArticleContent } from "@/components/articles/article-content";
import { ThoughtEditor } from "@/components/editor/thought-editor";
import { type ArticleTopic } from "@/lib/content/devops-library";

const copy = {
  snapshot: "Состояние",
  allArticles: "Всего статей",
  lastUpdate: "Последнее обновление",
  emptyValue: "Пока нет данных",
  updated: "Обновлено",
  created: "Создано",
  author: "Автор",
  lastEditor: "Последний редактор",
  reading: "Просмотр статьи",
  editor: "Редактор",
  editArticle: "Редактирование статьи",
  newNote: "Создание статьи",
  editorText:
    "Изменения сохраняются в PostgreSQL и сразу отображаются в структуре разделов.",
  editButton: "Редактировать",
  closeEditor: "К статье",
  noAccessEmptyTitle: "Пустой раздел",
  noAccessEmptyText:
    "В этой категории пока нет статей. У вас права только на просмотр, обратитесь к администратору для доступа к созданию.",
} as const;

type EditorArticle = Parameters<typeof ThoughtEditor>[0]["article"];
type EditorTopics = Parameters<typeof ThoughtEditor>[0]["topics"];
type EditorTopicCategories = Parameters<typeof ThoughtEditor>[0]["topicCategories"];
type WikiLink = Parameters<typeof ThoughtEditor>[0]["wikiLinks"][number];

type WorkspacePanelsProps = {
  selectedArticle: EditorArticle;
  selectedTopic: ArticleTopic;
  selectedCategory: string;
  topics: EditorTopics;
  topicCategories: EditorTopicCategories;
  totalArticles: number;
  lastUpdatedAt: string | null;
  isAdmin: boolean;
  currentUserId: string;
  canManageArticles: boolean;
  isEditMode: boolean;
  editArticleHref: string | null;
  closeEditorHref: string | null;
  wikiLinks: WikiLink[];
};

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function WorkspacePanels({
  selectedArticle,
  selectedTopic,
  selectedCategory,
  topics,
  topicCategories,
  totalArticles,
  lastUpdatedAt,
  isAdmin,
  currentUserId,
  canManageArticles,
  isEditMode,
  editArticleHref,
  closeEditorHref,
  wikiLinks,
}: WorkspacePanelsProps) {
  const canEditSelectedArticle = Boolean(
    selectedArticle &&
      canManageArticles &&
      (!selectedArticle.authorIsAdmin || isAdmin)
  );
  const canDeleteArticle = selectedArticle
    ? selectedArticle.authorId === currentUserId || isAdmin
    : false;
  const shouldShowEditor = canManageArticles && (!selectedArticle || (isEditMode && canEditSelectedArticle));

  return (
    <>
      <main className={`order-1 space-y-4 lg:order-2 ${shouldShowEditor ? "lg:col-span-2" : ""}`}>
        {shouldShowEditor ? (
          <section className="nook-surface rounded-2xl p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8ea9bd]">
                  {copy.editor}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[#e4eef6]">
                  {selectedArticle ? copy.editArticle : copy.newNote}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#9eb4c5]">{copy.editorText}</p>
              </div>
              {selectedArticle && closeEditorHref ? (
                <Link
                  href={closeEditorHref}
                  className="rounded-lg border border-[#3a556c] bg-[#152a3d] px-3 py-2 text-sm font-medium text-[#c9dcea] hover:bg-[#1a3247]"
                >
                  {copy.closeEditor}
                </Link>
              ) : null}
            </div>

            <ThoughtEditor
              article={selectedArticle}
              topics={topics}
              defaultTopic={selectedTopic}
              topicCategories={topicCategories}
              defaultCategory={selectedCategory}
              canDeleteArticle={canDeleteArticle}
              wikiLinks={wikiLinks}
              showStandalonePreview={false}
            />
          </section>
        ) : selectedArticle ? (
          <section className="nook-surface rounded-2xl p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#173d58] px-3 py-1 font-semibold text-[#97d5ef]">
                  {selectedArticle.topic}
                </span>
                <span className="rounded-full bg-[#1a3043] px-3 py-1 font-semibold text-[#b8cad7]">
                  {selectedArticle.category}
                </span>
                <span className="inline-flex items-center gap-1 text-[#92acbf]">
                  <Clock3 className="size-3.5" />
                  {copy.updated} {formatDateTime(selectedArticle.updatedAt)}
                </span>
              </div>
              {editArticleHref && canEditSelectedArticle ? (
                <Link
                  href={editArticleHref}
                  className="rounded-lg border border-[#3a556c] bg-[#152a3d] px-3 py-2 text-sm font-medium text-[#c9dcea] hover:bg-[#1a3247]"
                >
                  {copy.editButton}
                </Link>
              ) : null}
            </div>

            <h2 className="mt-4 text-[clamp(1.65rem,3vw,2.05rem)] font-semibold tracking-tight text-[#e8f0f7]">
              {selectedArticle.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#a4b8c8] sm:text-[15px]">
              {selectedArticle.summary}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#2f4a61] bg-[#13283a]/88 px-4 py-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-[#8ea9bd]">
                  <UserRound className="size-3.5" />
                  {copy.author}
                </div>
                <p className="mt-2 text-sm font-semibold text-[#e4eef6]">
                  {selectedArticle.authorName}
                </p>
                <p className="mt-1 text-xs text-[#8ea9bd]">
                  {copy.created} {formatDateTime(selectedArticle.createdAt)}
                </p>
              </div>

              <div className="rounded-xl border border-[#2f4a61] bg-[#13283a]/88 px-4 py-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-[#8ea9bd]">
                  <PenSquare className="size-3.5" />
                  {copy.lastEditor}
                </div>
                <p className="mt-2 text-sm font-semibold text-[#e4eef6]">
                  {selectedArticle.updatedByName}
                </p>
                <p className="mt-1 text-xs text-[#8ea9bd]">
                  {copy.updated} {formatDateTime(selectedArticle.updatedAt)}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-[#2f4a61] bg-[#122536]/65 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#c3d5e3]">
                <BookOpenText className="size-4 text-[#7cd9f3]" />
                {copy.reading}
              </div>
              <ArticleContent
                html={selectedArticle.contentHtml}
                wikiLinks={wikiLinks}
                className="max-w-none space-y-4 text-[15px] leading-7 text-[#b8cad8]"
              />
            </div>
          </section>
        ) : (
          <section className="nook-surface rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-[#e4eef6]">{copy.noAccessEmptyTitle}</h2>
            <p className="mt-2 text-sm leading-7 text-[#9fb5c6]">{copy.noAccessEmptyText}</p>
          </section>
        )}
      </main>

      {!shouldShowEditor ? (
        <aside className="order-3 space-y-3 sm:space-y-4">
          <section className="nook-surface rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8ea9bd]">
              {copy.snapshot}
            </p>
            <div className="mt-3 grid gap-2">
              <div className="rounded-xl border border-[#2f4a61] bg-[#13283a]/88 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#8ea9bd]">
                  {copy.allArticles}
                </p>
                <p className="mt-1 text-xl font-semibold text-[#e4eef6]">{totalArticles}</p>
              </div>
              <div className="rounded-xl border border-[#2f4a61] bg-[#13283a]/88 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#8ea9bd]">Категория</p>
                <p className="mt-1 text-sm font-semibold text-[#e4eef6]">{selectedCategory}</p>
              </div>
              <div className="rounded-xl border border-[#2f4a61] bg-[#13283a]/88 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#8ea9bd]">
                  {copy.lastUpdate}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#e4eef6]">
                  {lastUpdatedAt ? formatDateTime(lastUpdatedAt) : copy.emptyValue}
                </p>
              </div>
            </div>
          </section>
        </aside>
      ) : null}
    </>
  );
}
