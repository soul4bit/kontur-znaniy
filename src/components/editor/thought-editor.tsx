"use client";

import { type ChangeEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code2,
  Heading2,
  Heading3,
  ImageUp,
  List,
  ListOrdered,
  LoaderCircle,
  Minus,
  Quote,
  Save,
  Trash2,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArticleContent } from "@/components/articles/article-content";
import { type ArticleRecord } from "@/lib/articles/server";
import { type ArticleTopic } from "@/lib/content/devops-library";
import { NookImage } from "@/lib/editor/nook-image";
import { cn } from "@/lib/utils";

const copy = {
  emptyTitle: "Новая статья",
  emptyBody:
    "Опишите задачу, команды и итоговые выводы, чтобы быстро вернуться к решению позже.",
  placeholder:
    "Пишите пошагово: контекст, команды, конфиги и итог по задаче...",
  saveError: "Не удалось сохранить статью.",
  titleRequired: "Укажите заголовок статьи.",
  bodyRequired: "Статья не может быть пустой.",
  updated: "Изменения сохранены.",
  created: "Статья создана.",
  titleLabel: "Заголовок статьи",
  titlePlaceholder: "Например: Kubernetes probes без боли",
  draft: "Статистика",
  blocks: "блоков",
  chars: "символов",
  topicLabel: "Раздел",
  categoryLabel: "Категория",
  categoryPlaceholder: "Например: systemd",
  summaryLabel: "Короткое описание",
  summaryPlaceholder:
    "2-3 предложения, чтобы сразу понимать суть материала",
  bold: "Жирный",
  list: "Список",
  ordered: "Нумерация",
  quote: "Цитата",
  code: "Код",
  divider: "Разделитель",
  reset: "Сброс",
  saving: "Сохраняем...",
  saveChanges: "Сохранить изменения",
  createArticle: "Создать статью",
  newDraft: "Новый черновик",
  image: "Картинка",
  uploadingImage: "Загружаем картинку...",
  imageUploaded: "Картинка добавлена в статью.",
  imageUploadError: "Не удалось загрузить картинку.",
  deleteArticle: "Удалить статью",
  deleting: "Удаляем...",
  deleteConfirm: "Удалить статью? Это действие нельзя отменить.",
  deleteError: "Не удалось удалить статью.",
  footer:
    "Контент хранится в PostgreSQL и параллельно в markdown-представлении, поэтому статьи можно экспортировать отдельно.",
  previewTitle: "Предпросмотр в реальном времени",
  previewDescription:
    "Превью обновляется сразу во время набора, чтобы вы видели итоговый вид статьи до сохранения.",
  previewMode: "Предпросмотр без сохранения",
  previewToggle: "Предпросмотр",
  backToEditing: "Вернуться к редактированию",
  previewSummaryFallback: "Добавьте короткое описание, и оно появится в карточке статьи.",
  previewBodyFallback: "Начните писать, и здесь сразу появится живой предпросмотр контента.",
} as const;

const emptyDocument = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: copy.emptyTitle }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: copy.emptyBody }],
    },
  ],
};

const emptyHtml = `
  <h2>${copy.emptyTitle}</h2>
  <p>${copy.emptyBody}</p>
`;

const normalizedSeedContent = `${copy.emptyTitle} ${copy.emptyBody}`
  .trim()
  .replace(/\s+/g, " ");

function hasMeaningfulContent(value: string) {
  const normalizedValue = value.trim().replace(/\s+/g, " ");
  return normalizedValue.length > 0 && normalizedValue !== normalizedSeedContent;
}

type ThoughtEditorProps = {
  article: ArticleRecord | null;
  topics: readonly ArticleTopic[];
  defaultTopic: ArticleTopic;
  topicCategories: Record<ArticleTopic, readonly string[]>;
  defaultCategory: string;
  canDeleteArticle?: boolean;
  wikiLinks: Array<{
    slug: string;
    title: string;
    href: string;
  }>;
  showStandalonePreview?: boolean;
  onPreviewChange?: (preview: ThoughtEditorPreview) => void;
};

export type ThoughtEditorPreview = {
  title: string;
  summary: string;
  topic: ArticleTopic;
  category: string;
  contentHtml: string;
  hasContent: boolean;
};

type SaveFeedback = {
  tone: "error" | "success";
  text: string;
} | null;

type ArticleResponse = {
  article: ArticleRecord;
};

type DeleteResponse = {
  success: boolean;
};

type EditorButtonProps = {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
};

function EditorButton({ active = false, onClick, children }: EditorButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={cn(
        "h-8 rounded-lg border-border bg-card text-[13px] text-foreground hover:bg-accent",
        active && "border-primary/65 bg-primary/10 text-foreground hover:bg-primary/15"
      )}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

async function saveArticleRequest(articleId: string | null, payload: Record<string, unknown>) {
  const response = await fetch(articleId ? `/api/articles/${articleId}` : "/api/articles", {
    method: articleId ? "PATCH" : "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const result = (await response.json()) as ArticleResponse | { message?: string };

  if (!response.ok) {
    const message = "message" in result ? result.message : undefined;
    throw new Error(message ?? copy.saveError);
  }

  return result as ArticleResponse;
}

async function deleteArticleRequest(articleId: string) {
  const response = await fetch(`/api/articles/${articleId}`, {
    method: "DELETE",
    credentials: "include",
  });

  const result = (await response.json()) as DeleteResponse | { message?: string };

  if (!response.ok) {
    const message = "message" in result ? result.message : undefined;
    throw new Error(message ?? copy.deleteError);
  }

  return result as DeleteResponse;
}

async function uploadArticleImage(file: File) {
  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch("/api/articles/image", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const result = (await response.json()) as { imageUrl?: string; message?: string };

  if (!response.ok || !result.imageUrl) {
    throw new Error(result.message ?? copy.imageUploadError);
  }

  return result.imageUrl;
}

export function ThoughtEditor({
  article,
  topics,
  defaultTopic,
  topicCategories,
  defaultCategory,
  canDeleteArticle = false,
  wikiLinks,
  showStandalonePreview = true,
  onPreviewChange,
}: ThoughtEditorProps) {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(article?.title ?? "");
  const [summary, setSummary] = useState(article?.summary ?? "");
  const [topic, setTopic] = useState<ArticleTopic>(article?.topic ?? defaultTopic);
  const [category, setCategory] = useState(article?.category ?? defaultCategory);
  const [feedback, setFeedback] = useState<SaveFeedback>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(article?.contentHtml ?? emptyHtml);
  const [stats, setStats] = useState({ chars: 0, paragraphs: 0 });
  const [hasPreviewContent, setHasPreviewContent] = useState(
    hasMeaningfulContent(article?.contentText ?? "")
  );
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const availableCategories = useMemo(
    () => topicCategories[topic] ?? [],
    [topic, topicCategories]
  );

  const initialJson = useMemo(
    () => article?.contentJson ?? emptyDocument,
    [article?.contentJson]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      NookImage,
      Placeholder.configure({
        placeholder: copy.placeholder,
      }),
    ],
    content: initialJson,
    immediatelyRender: false,
    onCreate: ({ editor: currentEditor }) => {
      const text = currentEditor.getText().trim();
      setPreviewHtml(currentEditor.getHTML());
      setHasPreviewContent(hasMeaningfulContent(text));
      setStats({
        chars: text.length,
        paragraphs: currentEditor.getJSON().content?.length ?? 0,
      });
    },
    onUpdate: ({ editor: currentEditor }) => {
      const text = currentEditor.getText().trim();
      setPreviewHtml(currentEditor.getHTML());
      setHasPreviewContent(hasMeaningfulContent(text));
      setStats({
        chars: text.length,
        paragraphs: currentEditor.getJSON().content?.length ?? 0,
      });
    },
    editorProps: {
      attributes: {
        class:
          "nook-editor min-h-80 rounded-2xl border border-border bg-card px-5 py-4 text-[15px] leading-7 text-foreground shadow-sm focus-visible:outline-none",
      },
    },
  });

  useEffect(() => {
    setTitle(article?.title ?? "");
    setSummary(article?.summary ?? "");
    setTopic(article?.topic ?? defaultTopic);
    setCategory(article?.category ?? defaultCategory);
    setFeedback(null);
    setPreviewHtml(article?.contentHtml ?? emptyHtml);
    setHasPreviewContent(hasMeaningfulContent(article?.contentText ?? ""));
    setIsPreviewMode(false);

    if (!editor) {
      return;
    }

    editor.commands.setContent(article?.contentJson ?? emptyDocument);
  }, [article, defaultCategory, defaultTopic, editor]);

  useEffect(() => {
    if (!category.trim()) {
      setCategory(availableCategories[0] ?? "Общее");
      return;
    }

    if (!availableCategories.includes(category)) {
      setCategory(availableCategories[0] ?? "Общее");
    }
  }, [availableCategories, category]);

  useEffect(() => {
    if (!onPreviewChange) {
      return;
    }

    onPreviewChange({
      title: title.trim(),
      summary: summary.trim(),
      topic,
      category: category.trim() || "Общее",
      contentHtml: previewHtml,
      hasContent: hasPreviewContent,
    });
  }, [category, hasPreviewContent, onPreviewChange, previewHtml, summary, title, topic]);

  async function handleSave() {
    if (!editor) {
      return;
    }

    const trimmedTitle = title.trim();
    const contentText = editor.getText().trim();

    if (!trimmedTitle) {
      setFeedback({ tone: "error", text: copy.titleRequired });
      return;
    }

    if (!contentText) {
      setFeedback({ tone: "error", text: copy.bodyRequired });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const result = await saveArticleRequest(article?.id ?? null, {
        title: trimmedTitle,
        topic,
        category,
        summary,
        contentHtml: editor.getHTML(),
        contentJson: editor.getJSON(),
        contentText,
      });

      setFeedback({
        tone: "success",
        text: article ? copy.updated : copy.created,
      });
      router.replace(
        `/app?topic=${encodeURIComponent(result.article.topic)}&category=${encodeURIComponent(
          result.article.category
        )}&draft=0&article=${result.article.id}`
      );
      router.refresh();
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : copy.saveError,
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleNewDraft() {
    setTitle("");
    setSummary("");
    setTopic(defaultTopic);
    setCategory(defaultCategory);
    setFeedback(null);
    setPreviewHtml(emptyHtml);
    setStats({ chars: 0, paragraphs: 0 });
    setHasPreviewContent(false);
    setIsPreviewMode(false);
    editor?.commands.setContent(emptyHtml);
    router.replace(
      `/app?topic=${encodeURIComponent(defaultTopic)}&category=${encodeURIComponent(
        defaultCategory
      )}&draft=1`
    );
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !editor) {
      return;
    }

    setIsUploadingImage(true);
    setFeedback(null);

    try {
      const imageUrl = await uploadArticleImage(file);
      editor
        .chain()
        .focus()
        .insertContent({
          type: "nookImage",
          attrs: {
            src: imageUrl,
            alt: title.trim() || "Article image",
            title: title.trim() || undefined,
          },
        })
        .run();
      setFeedback({
        tone: "success",
        text: copy.imageUploaded,
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : copy.imageUploadError,
      });
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  }

  async function handleDelete() {
    if (!article) {
      return;
    }

    if (!window.confirm(copy.deleteConfirm)) {
      return;
    }

    setIsDeleting(true);
    setFeedback(null);

    try {
      await deleteArticleRequest(article.id);
      router.replace(
        `/app?topic=${encodeURIComponent(article.topic)}&category=${encodeURIComponent(
          article.category
        )}`
      );
      router.refresh();
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : copy.deleteError,
      });
    } finally {
      setIsDeleting(false);
    }
  }

  if (!editor) return null;

  return (
    <div className="space-y-5">
      {!isPreviewMode ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="article-title" className="text-sm font-medium text-muted-foreground">
                {copy.titleLabel}
              </label>
              <Input
                id="article-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={copy.titlePlaceholder}
                className="h-11"
              />
            </div>

            <div className="nook-panel-soft rounded-xl px-4 py-2.5 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">{copy.draft}</p>
              <p className="mt-2">
                {stats.paragraphs} {copy.blocks}
              </p>
              <p>
                {stats.chars} {copy.chars}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="article-topic" className="text-sm font-medium text-muted-foreground">
                {copy.topicLabel}
              </label>
              <select
                id="article-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value as ArticleTopic)}
                className="h-11 w-full rounded-xl border border-input bg-card px-4 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35"
              >
                {topics.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="article-category" className="text-sm font-medium text-muted-foreground">
                {copy.categoryLabel}
              </label>
              <Input
                id="article-category"
                list="article-category-list"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder={copy.categoryPlaceholder}
                className="h-11"
              />
              <datalist id="article-category-list">
                {availableCategories.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="article-summary" className="text-sm font-medium text-muted-foreground">
              {copy.summaryLabel}
            </label>
            <Textarea
              id="article-summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder={copy.summaryPlaceholder}
              rows={3}
              className="min-h-12"
            />
          </div>

          <div className="sticky top-20 z-10 -mx-1 flex flex-wrap gap-2 rounded-2xl border border-border bg-card/95 p-2 backdrop-blur">
            <EditorButton
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold />
              {copy.bold}
            </EditorButton>
            <EditorButton
              active={editor.isActive("heading", { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 />
              H2
            </EditorButton>
            <EditorButton
              active={editor.isActive("heading", { level: 3 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              <Heading3 />
              H3
            </EditorButton>
            <EditorButton
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List />
              {copy.list}
            </EditorButton>
            <EditorButton
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered />
              {copy.ordered}
            </EditorButton>
            <EditorButton
              active={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote />
              {copy.quote}
            </EditorButton>
            <EditorButton
              active={editor.isActive("codeBlock")}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            >
              <Code2 />
              {copy.code}
            </EditorButton>
            <EditorButton onClick={() => imageInputRef.current?.click()}>
              <ImageUp />
              {isUploadingImage ? copy.uploadingImage : copy.image}
            </EditorButton>
            <EditorButton onClick={() => editor.chain().focus().setHorizontalRule().run()}>
              <Minus />
              {copy.divider}
            </EditorButton>
            <EditorButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
              <Type />
              {copy.reset}
            </EditorButton>
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleImageChange}
          />

          <EditorContent editor={editor} />

          {showStandalonePreview ? (
            <div className="nook-panel rounded-2xl p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {copy.previewTitle}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.previewDescription}</p>

              <div className="nook-panel-soft mt-4 rounded-xl px-4 py-4">
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  {title.trim() || copy.emptyTitle}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {summary.trim() || copy.previewSummaryFallback}
                </p>
              </div>

              <div className="nook-panel-soft mt-4 rounded-xl p-4">
                {hasPreviewContent ? (
                  <ArticleContent
                    html={previewHtml}
                    wikiLinks={wikiLinks}
                    className="max-w-none space-y-4 text-sm leading-7 text-foreground"
                  />
                ) : (
                  <p className="text-sm leading-7 text-muted-foreground">{copy.previewBodyFallback}</p>
                )}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="nook-panel rounded-2xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {copy.previewMode}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.previewDescription}</p>

          <div className="nook-panel-soft mt-4 rounded-xl px-4 py-4">
            <h3 className="text-xl font-semibold tracking-tight text-foreground">
              {title.trim() || copy.emptyTitle}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {summary.trim() || copy.previewSummaryFallback}
            </p>
          </div>

          <div className="nook-panel-soft mt-4 rounded-xl p-4">
            {hasPreviewContent ? (
              <ArticleContent
                html={previewHtml}
                wikiLinks={wikiLinks}
                className="max-w-none space-y-4 text-sm leading-7 text-foreground"
              />
            ) : (
              <p className="text-sm leading-7 text-muted-foreground">{copy.previewBodyFallback}</p>
            )}
          </div>
        </div>
      )}

      {feedback ? (
        <div
          className={cn(
            "rounded-[18px] border px-4 py-3 text-sm leading-6",
            feedback.tone === "success"
              ? "border-emerald-500/45 bg-emerald-50 text-emerald-800"
              : "border-rose-500/45 bg-rose-50 text-rose-700"
          )}
        >
          {feedback.text}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {!showStandalonePreview ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => setIsPreviewMode((currentValue) => !currentValue)}
            disabled={isSaving || isDeleting || isUploadingImage}
          >
            {isPreviewMode ? copy.backToEditing : copy.previewToggle}
          </Button>
        ) : null}

        <Button
          type="button"
          className="rounded-2xl px-5"
          onClick={handleSave}
          disabled={isSaving || isDeleting || isUploadingImage}
        >
          {isSaving ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              {copy.saving}
            </>
          ) : (
            <>
              <Save className="size-4" />
              {article ? copy.saveChanges : copy.createArticle}
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="rounded-2xl"
          onClick={handleNewDraft}
          disabled={isSaving || isDeleting || isUploadingImage}
        >
          {copy.newDraft}
        </Button>

        {article && canDeleteArticle ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl border-rose-500/45 bg-rose-50 text-rose-700 hover:bg-rose-100"
            onClick={handleDelete}
            disabled={isSaving || isDeleting || isUploadingImage}
          >
            {isDeleting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                {copy.deleting}
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                {copy.deleteArticle}
              </>
            )}
          </Button>
        ) : null}
      </div>

      <div className="nook-panel-soft rounded-xl p-4 text-sm leading-7 text-muted-foreground">
        {copy.footer}
      </div>
    </div>
  );
}



