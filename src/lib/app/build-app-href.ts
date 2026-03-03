type BuildAppHrefOptions = {
  articleId?: string;
  draft?: boolean;
  edit?: boolean;
  category?: string;
  query?: string;
};

export function buildAppHref(topic: string, options?: BuildAppHrefOptions) {
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

  if (options?.edit) {
    params.set("edit", "1");
  }

  if (options?.query?.trim()) {
    params.set("q", options.query.trim());
  }

  return `/app?${params.toString()}`;
}
