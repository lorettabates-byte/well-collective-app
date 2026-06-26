import type { ReactNode } from "react";

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

/** Splits text on URLs and renders them as clickable links, leaving everything else as plain text. */
export function linkify(text: string): ReactNode[] {
  return text.split(URL_PATTERN).map((part, i) => {
    if (part.match(URL_PATTERN)) {
      // Trim trailing punctuation that's likely part of the sentence, not the URL.
      const trailingMatch = part.match(/[.,!?;:)]+$/);
      const trailing = trailingMatch ? trailingMatch[0] : "";
      const url = trailing ? part.slice(0, -trailing.length) : part;
      return (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-brand-light underline break-all"
        >
          {url}
        </a>
      );
    }
    return part ? <span key={i}>{part}</span> : null;
  });
}
