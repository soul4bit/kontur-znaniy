"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code2,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  LoaderCircle,
  Minus,
  Quote,
  Save,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type ArticleRecord } from "@/lib/articles/server";
import { type ArticleTopic } from "@/lib/content/devops-library";

const emptyDocument = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Новая статья" }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "Зафиксируй разбор, команды и выводы по задаче." }],
    },
  ],
};

const emptyHtml = `
  <h2>Новая статья</h2>
  <p>Зафиксируй разбор, команды и выводы по задаче.</p>
`;

type ThoughtEditorProps = {
  article: ArticleRecord | null;
  topics: readonly ArticleTopic[];
};

type SaveFeedback = {
  tone: "error" | "success";
  text: string;
} | null;

type ArticleResponse = {
  article: ArticleRecord;
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
        "rounded-xl border-slate-200 bg-white/80 text-slate-900 hover:bg-[#edf3ef]",
        active && "border-[#2f7a67] bg-[#2f7a67] text-white hover:bg-[#2f7a67]"
      )}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

async function saveArticleRequest(
  articleId: string | null,
  payload: Record<string, unknown>
) {
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
    throw new Error(message ?? "Не удалось сохранить статью.");
  }

  return result as ArticleResponse;
}

export function ThoughtEditor({ article, topics }: ThoughtEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(article?.title ?? "");
  const [summary, setSummary] = useState(article?.summary ?? "");
  const [topic, setTopic] = useState<ArticleTopic>(article?.topic ?? topics[0]);
  const [feedback, setFeedback] = useState<SaveFeedback>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({ chars: 0, paragraphs: 0 });

  const initialJson = useMemo(
    () => article?.contentJson ?? emptyDocument,
    [article?.contentJson]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Пиши разбор, шпаргалку, команды, выводы и свои заметки по задаче...",
      }),
    ],
    content: initialJson,
    immediatelyRender: false,
    onCreate: ({ editor: currentEditor }) => {
      const text = currentEditor.getText().trim();
      setStats({
        chars: text.length,
        paragraphs: currentEditor.getJSON().content?.length ?? 0,
      });
    },
    onUpdate: ({ editor: currentEditor }) => {
      const text = currentEditor.getText().trim();
      setStats({
        chars: text.length,
        paragraphs: currentEditor.getJSON().content?.length ?? 0,
      });
    },
    editorProps: {
      attributes: {
        class:
          "nook-editor min-h-80 rounded-[28px] border border-slate-200 bg-white/92 px-5 py-4 text-[15px] leading-7 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] focus-visible:outline-none",
      },
    },
  });

  useEffect(() => {
    setTitle(article?.title ?? "");
    setSummary(article?.summary ?? "");
    setTopic(article?.topic ?? topics[0]);
    setFeedback(null);

    if (!editor) {
      return;
    }

    editor.commands.setContent(article?.contentJson ?? emptyDocument);
  }, [article, editor, topics]);

  async function handleSave() {
    if (!editor) {
      return;
    }

    const trimmedTitle = title.trim();
    const contentText = editor.getText().trim();

    if (!trimmedTitle) {
      setFeedback({ tone: "error", text: "Укажите заголовок статьи." });
      return;
    }

    if (!contentText) {
      setFeedback({ tone: "error", text: "Статья не может быть пустой." });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const result = await saveArticleRequest(article?.id ?? null, {
        title: trimmedTitle,
        topic,
        summary,
        contentHtml: editor.getHTML(),
        contentJson: editor.getJSON(),
        contentText,
      });

      setFeedback({
        tone: "success",
        text: article ? "Статья обновлена." : "Статья создана.",
      });
      router.replace(`/app?article=${result.article.id}`);
      router.refresh();
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Не удалось сохранить статью.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleNewDraft() {
    setTitle("");
    setSummary("");
    setTopic(topics[0]);
    setFeedback(null);
    editor?.commands.setContent(emptyHtml);
    router.replace("/app");
  }

  if (!editor) return null;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-2">
          <label htmlFor="article-title" className="text-sm font-medium text-slate-900">
            Заголовок статьи
          </label>
          <Input
            id="article-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Например: Kubernetes probes without pain"
            className="h-12 rounded-2xl border-slate-200 bg-white text-slate-900"
          />
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-[#f4f7f4] px-4 py-3 text-sm leading-6 text-slate-600">
          <p className="font-medium text-slate-900">Черновик</p>
          <p className="mt-2">{stats.paragraphs} блоков</p>
          <p>{stats.chars} символов</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="space-y-2">
          <label htmlFor="article-topic" className="text-sm font-medium text-slate-900">
            Направление
          </label>
          <select
            id="article-topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value as ArticleTopic)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus-visible:border-[#68a897]"
          >
            {topics.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="article-summary" className="text-sm font-medium text-slate-900">
            Короткое описание
          </label>
          <Input
            id="article-summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Пара строк, чтобы в списке было понятно, о чем статья"
            className="h-12 rounded-2xl border-slate-200 bg-white text-slate-900"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <EditorButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold />
          Жирный
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
          Список
        </EditorButton>
        <EditorButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered />
          Нумерация
        </EditorButton>
        <EditorButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote />
          Цитата
        </EditorButton>
        <EditorButton
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 />
          Код
        </EditorButton>
        <EditorButton onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus />
          Разделитель
        </EditorButton>
        <EditorButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
          <Type />
          Сброс
        </EditorButton>
      </div>

      <EditorContent editor={editor} />

      {feedback ? (
        <div
          className={cn(
            "rounded-[24px] border px-4 py-3 text-sm leading-6",
            feedback.tone === "success"
              ? "border-slate-200 bg-[#edf3ef] text-teal-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          )}
        >
          {feedback.text}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          className="rounded-2xl bg-[#2f7a67] px-5 text-white hover:bg-[#286857]"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Сохраняем...
            </>
          ) : (
            <>
              <Save className="size-4" />
              {article ? "Сохранить изменения" : "Создать статью"}
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="rounded-2xl border-slate-200 bg-white/80 text-slate-900 hover:bg-[#edf3ef]"
          onClick={handleNewDraft}
          disabled={isSaving}
        >
          Новый черновик
        </Button>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-[#f4f7f4] p-4 text-sm leading-7 text-slate-600">
        Текст статьи хранится в PostgreSQL. Картинки для статей лучше держать отдельными
        файлами на сервере и сохранять в базе только путь к ним. Это будет следующим шагом.
      </div>
    </div>
  );
}