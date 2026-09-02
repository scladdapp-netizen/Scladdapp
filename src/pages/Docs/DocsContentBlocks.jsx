import { parseYoutubeId } from "./docsBlocksUtils";
import "./Docs.css";

function DocsVideoBlock({ block }) {
  const youtubeId = parseYoutubeId(block.youtubeId);
  if (!youtubeId) return null;

  return (
    <div className="docs-pg__video-wrap">
      {block.title && (
        <div className="docs-pg__video-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
          {block.title}
        </div>
      )}
      <div className="docs-pg__video-frame">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title={block.title || "YouTube video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}

function DocsImageBlock({ block }) {
  if (!block.url) return null;

  return (
    <figure className="docs-pg__image-wrap">
      <img src={block.url} alt={block.alt || ""} loading="lazy" />
      {block.caption && <figcaption>{block.caption}</figcaption>}
    </figure>
  );
}

export default function DocsContentBlocks({ blocks, className = "" }) {
  if (!blocks?.length) return null;

  return (
    <div className={`docs-pg__blocks${className ? ` ${className}` : ""}`}>
      {blocks.map((block, index) => {
        if (block.type === "paragraph" && block.text) {
          return <p key={index} className="docs-pg__block-paragraph">{block.text}</p>;
        }
        if (block.type === "video") {
          return <DocsVideoBlock key={index} block={block} />;
        }
        if (block.type === "image") {
          return <DocsImageBlock key={index} block={block} />;
        }
        return null;
      })}
    </div>
  );
}
