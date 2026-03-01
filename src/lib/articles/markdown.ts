type MarkNode = {
  type?: string;
  attrs?: Record<string, unknown>;
};

type ContentNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: MarkNode[];
  content?: ContentNode[];
};

function asContentNodes(value: unknown) {
  return Array.isArray(value) ? (value as ContentNode[]) : [];
}

function escapeMarkdownText(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/([*_`~[\]()>#+\-!|])/g, "\\$1");
}

function escapeMarkdownLinkText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/([\[\]])/g, "\\$1");
}

function escapeMarkdownLinkTitle(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function applyMarks(text: string, marks: MarkNode[] | undefined) {
  if (!marks?.length) {
    return escapeMarkdownText(text);
  }

  let output = escapeMarkdownText(text);

  for (const mark of marks) {
    switch (mark.type) {
      case "code": {
        const raw = text.replace(/`/g, "\\`");
        output = `\`${raw}\``;
        break;
      }
      case "bold":
        output = `**${output}**`;
        break;
      case "italic":
        output = `*${output}*`;
        break;
      case "strike":
        output = `~~${output}~~`;
        break;
      case "link": {
        const href =
          typeof mark.attrs?.href === "string" ? mark.attrs.href.trim() : "";
        const title =
          typeof mark.attrs?.title === "string" ? mark.attrs.title.trim() : "";
        const label = escapeMarkdownLinkText(output || href);

        if (!href) {
          break;
        }

        output = title
          ? `[${label}](${href} "${escapeMarkdownLinkTitle(title)}")`
          : `[${label}](${href})`;
        break;
      }
      default:
        break;
    }
  }

  return output;
}

function renderImage(attrs: Record<string, unknown> | undefined) {
  const src = typeof attrs?.src === "string" ? attrs.src.trim() : "";
  const alt = typeof attrs?.alt === "string" ? attrs.alt.trim() : "";
  const title = typeof attrs?.title === "string" ? attrs.title.trim() : "";

  if (!src) {
    return "";
  }

  const escapedAlt = escapeMarkdownLinkText(alt);
  return title
    ? `![${escapedAlt}](${src} "${escapeMarkdownLinkTitle(title)}")`
    : `![${escapedAlt}](${src})`;
}

function renderInlineNodes(nodes: ContentNode[]) {
  const parts: string[] = [];

  for (const node of nodes) {
    switch (node.type) {
      case "text":
        parts.push(applyMarks(node.text ?? "", node.marks));
        break;
      case "hardBreak":
        parts.push("  \n");
        break;
      case "image":
      case "nookImage":
        parts.push(renderImage(node.attrs));
        break;
      default:
        if (node.content?.length) {
          parts.push(renderInlineNodes(node.content));
        }
        break;
    }
  }

  return parts.join("");
}

function indentLines(text: string, indent: number) {
  const padding = " ".repeat(indent);
  return text
    .split("\n")
    .map((line) => (line.length ? `${padding}${line}` : line))
    .join("\n");
}

function joinBlocks(blocks: string[]) {
  return blocks.filter(Boolean).join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

function renderListItem(
  item: ContentNode,
  marker: string,
  indent: number
) {
  const blocks = asContentNodes(item.content);

  if (!blocks.length) {
    return `${" ".repeat(indent)}${marker}`;
  }

  const [firstBlock, ...restBlocks] = blocks;
  let firstContent = "";

  if (firstBlock.type === "paragraph") {
    firstContent = renderInlineNodes(asContentNodes(firstBlock.content));
  } else if (firstBlock.type === "bulletList") {
    firstContent = `\n${renderBulletList(asContentNodes(firstBlock.content), indent + 2)}`;
  } else if (firstBlock.type === "orderedList") {
    const nestedStart =
      typeof firstBlock.attrs?.start === "number" ? firstBlock.attrs.start : 1;
    firstContent = `\n${renderOrderedList(
      asContentNodes(firstBlock.content),
      indent + 2,
      nestedStart
    )}`;
  } else {
    firstContent = renderBlockNode(firstBlock, indent + 2);
  }

  let output = `${" ".repeat(indent)}${marker}${firstContent}`.trimEnd();

  for (const block of restBlocks) {
    if (block.type === "bulletList") {
      output += `\n${renderBulletList(asContentNodes(block.content), indent + 2)}`;
      continue;
    }

    if (block.type === "orderedList") {
      const nestedStart = typeof block.attrs?.start === "number" ? block.attrs.start : 1;
      output += `\n${renderOrderedList(asContentNodes(block.content), indent + 2, nestedStart)}`;
      continue;
    }

    const rendered = renderBlockNode(block, 0);
    if (rendered) {
      output += `\n${indentLines(rendered, indent + 2)}`;
    }
  }

  return output;
}

function renderBulletList(items: ContentNode[], indent: number) {
  const rendered = items.map((item) => renderListItem(item, "- ", indent));
  return rendered.filter(Boolean).join("\n");
}

function renderOrderedList(items: ContentNode[], indent: number, start: number) {
  const rendered = items.map((item, index) =>
    renderListItem(item, `${start + index}. `, indent)
  );
  return rendered.filter(Boolean).join("\n");
}

function renderBlockNode(node: ContentNode, indent = 0): string {
  switch (node.type) {
    case "doc": {
      const blocks = asContentNodes(node.content).map((child) => renderBlockNode(child, indent));
      return joinBlocks(blocks);
    }
    case "paragraph":
      return indentLines(renderInlineNodes(asContentNodes(node.content)), indent);
    case "heading": {
      const level =
        typeof node.attrs?.level === "number"
          ? Math.max(1, Math.min(6, node.attrs.level))
          : 2;
      const text = renderInlineNodes(asContentNodes(node.content));
      return indentLines(`${"#".repeat(level)} ${text}`.trim(), indent);
    }
    case "bulletList":
      return renderBulletList(asContentNodes(node.content), indent);
    case "orderedList": {
      const start = typeof node.attrs?.start === "number" ? node.attrs.start : 1;
      return renderOrderedList(asContentNodes(node.content), indent, start);
    }
    case "blockquote": {
      const inner = joinBlocks(
        asContentNodes(node.content).map((child) => renderBlockNode(child, 0))
      );
      if (!inner) {
        return "";
      }

      return indentLines(
        inner
          .split("\n")
          .map((line) => (line.length ? `> ${line}` : ">"))
          .join("\n"),
        indent
      );
    }
    case "codeBlock": {
      const language =
        typeof node.attrs?.language === "string" ? node.attrs.language.trim() : "";
      const text = asContentNodes(node.content)
        .map((child) => child.text ?? "")
        .join("");
      const fence = language ? `\`\`\`${language}` : "```";
      return indentLines(`${fence}\n${text}\n\`\`\``, indent);
    }
    case "horizontalRule":
      return indentLines("---", indent);
    case "image":
    case "nookImage":
      return indentLines(renderImage(node.attrs), indent);
    default: {
      if (!node.content?.length) {
        return "";
      }

      const blocks = asContentNodes(node.content).map((child) => renderBlockNode(child, indent));
      return joinBlocks(blocks);
    }
  }
}

export function tiptapJsonToMarkdown(
  contentJson: Record<string, unknown>,
  fallbackText: string
) {
  try {
    const markdown = renderBlockNode(contentJson as ContentNode, 0).trim();
    if (markdown) {
      return markdown;
    }
  } catch {
    return fallbackText.trim();
  }

  return fallbackText.trim();
}
