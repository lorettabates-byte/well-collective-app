import type { ReactNode } from "react";

// Matches http/https URLs and bare www. links in user-authored text.
const URL_PATTERN = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

/** Splits text on URLs and renders them as clickable links. */
export function linkify(text: string): ReactNode[] {
  return text.split(URL_PATTERN).map((part, i) => {
    if (part.match(URL_PATTERN)) {
      // Trim trailing punctuation that's likely part of the sentence, not the URL.
      const trailingMatch = part.match(/[.,!?;:)]+$/);
      const trailing = trailingMatch ? trailingMatch[0] : "";
      const raw = trailing ? part.slice(0, -trailing.length) : part;
      const url = raw.startsWith("www.") ? `https://${raw}` : raw;
      return (
        <span key={i}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-brand-light underline break-all"
          >
            {raw}
          </a>
          {trailing}
        </span>
      );
    }
    return part ? <span key={i}>{part}</span> : null;
  });
}
