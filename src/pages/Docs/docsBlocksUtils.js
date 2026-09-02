/** Normalize topic/steps to blocks[] for rendering (backward compatible). */
export function getTopicBlocks(item) {
  if (Array.isArray(item?.blocks) && item.blocks.length > 0) {
    return item.blocks;
  }

  const blocks = [];
  if (item?.content) {
    blocks.push({ type: "paragraph", text: item.content });
  }
  if (item?.video?.youtubeId) {
    blocks.push({
      type: "video",
      title: item.video.title || "Video",
      youtubeId: item.video.youtubeId,
    });
  }
  return blocks;
}

export function getStepBlocks(step) {
  if (Array.isArray(step?.blocks) && step.blocks.length > 0) {
    return step.blocks;
  }
  if (step?.desc) {
    return [{ type: "paragraph", text: step.desc }];
  }
  return [];
}

export function parseYoutubeId(input = "") {
  const trimmed = String(input).trim();
  if (!trimmed) return "";
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : trimmed;
}

export function topicSearchText(item) {
  let text = `${item.title} ${item.content || ""}`;
  for (const block of getTopicBlocks(item)) {
    if (block.text) text += ` ${block.text}`;
    if (block.title) text += ` ${block.title}`;
    if (block.alt) text += ` ${block.alt}`;
    if (block.caption) text += ` ${block.caption}`;
  }
  for (const step of item.steps || []) {
    text += ` ${step.step || ""} ${step.desc || ""}`;
    for (const block of getStepBlocks(step)) {
      if (block.text) text += ` ${block.text}`;
    }
  }
  return text.toLowerCase();
}

export function emptyBlock(type) {
  if (type === "paragraph") return { type: "paragraph", text: "" };
  if (type === "video") return { type: "video", title: "", youtubeId: "" };
  if (type === "image") return { type: "image", url: "", alt: "", caption: "", public_id: "" };
  return { type: "paragraph", text: "" };
}

export function normalizeTopicBlocks(topic) {
  const blocks = getTopicBlocks(topic).map((block) => {
    if (block.type === "video") {
      return {
        type: "video",
        title: block.title || "",
        youtubeId: parseYoutubeId(block.youtubeId || ""),
      };
    }
    if (block.type === "image") {
      return {
        type: "image",
        url: (block.url || "").trim(),
        alt: block.alt || "",
        caption: block.caption || "",
        public_id: block.public_id || "",
      };
    }
    return { type: "paragraph", text: block.text || "" };
  }).filter((block) => {
    if (block.type === "paragraph") return block.text.trim().length > 0;
    if (block.type === "video") return block.youtubeId.length > 0;
    if (block.type === "image") return block.url.length > 0;
    return false;
  });

  const firstParagraph = blocks.find((b) => b.type === "paragraph");
  return {
    blocks,
    content: firstParagraph?.text || topic.content || topic.title || "",
    video: null,
  };
}

export function sanitizeDocsForSave(docs) {
  return docs.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      const normalized = normalizeTopicBlocks(item);
      return {
        ...item,
        content: normalized.content,
        blocks: normalized.blocks,
        video: null,
        steps: (item.steps || []).map((step) => {
          const stepBlocks = (step.blocks || getStepBlocks(step))
            .map((block) => {
              if (block.type === "video") {
                return {
                  type: "video",
                  title: block.title || "",
                  youtubeId: parseYoutubeId(block.youtubeId || ""),
                };
              }
              if (block.type === "image") {
                return {
                  type: "image",
                  url: (block.url || "").trim(),
                  alt: block.alt || "",
                  caption: block.caption || "",
                  public_id: block.public_id || "",
                };
              }
              return { type: "paragraph", text: block.text || "" };
            })
            .filter((block) => {
              if (block.type === "paragraph") return block.text.trim().length > 0;
              if (block.type === "video") return block.youtubeId.length > 0;
              if (block.type === "image") return block.url.length > 0;
              return false;
            });

          const firstParagraph = stepBlocks.find((b) => b.type === "paragraph");
          return {
            step: step.step || "",
            desc: firstParagraph?.text || step.desc || "",
            blocks: stepBlocks,
          };
        }),
      };
    }),
  }));
}
