import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { isArticleTopic, updateArticle, type SaveArticleInput } from "@/lib/articles/server";

function badRequest(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ articleId: string }> }
) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ message: "Нужна авторизация." }, { status: 401 });
  }

  const { articleId } = await context.params;
  const body = (await request.json()) as Partial<SaveArticleInput>;

  if (!body.title?.trim()) {
    return badRequest("Укажите заголовок статьи.");
  }

  if (!body.topic || !isArticleTopic(body.topic)) {
    return badRequest("Выберите направление статьи.");
  }

  if (!body.contentHtml?.trim() || !body.contentText?.trim()) {
    return badRequest("Статья не может быть пустой.");
  }

  if (!body.contentJson || typeof body.contentJson !== "object") {
    return badRequest("Не удалось прочитать содержимое статьи.");
  }

  const article = await updateArticle(articleId, {
    authorId: session.user.id,
    title: body.title,
    topic: body.topic,
    summary: body.summary ?? "",
    contentHtml: body.contentHtml,
    contentJson: body.contentJson as Record<string, unknown>,
    contentText: body.contentText,
  });

  if (!article) {
    return NextResponse.json({ message: "Статья не найдена." }, { status: 404 });
  }

  return NextResponse.json({ article });
}
