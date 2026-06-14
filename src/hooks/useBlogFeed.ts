import { useEffect, useState } from "react";

export const BLOG_URL = "https://lorettabates.com/videolibrary.lorettabates.com/blog/";

export interface BlogPost {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  thumbnail: string | null;
}

interface FeedState {
  posts: BlogPost[];
  loading: boolean;
  error: boolean;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function extractThumbnail(item: Record<string, unknown>): string | null {
  const thumbnail = item.thumbnail as string | undefined;
  if (thumbnail) return thumbnail;

  const content = (item.content as string) || (item.description as string) || "";
  const match = content.match(/<img[^>]+src="([^"]+)"/);
  return match ? match[1] : null;
}

export function useBlogFeed(): FeedState {
  const [state, setState] = useState<FeedState>({ posts: [], loading: true, error: false });

  useEffect(() => {
    let cancelled = false;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(`${BLOG_URL}feed/`)}`;

    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.status !== "ok" || !Array.isArray(data.items)) {
          setState({ posts: [], loading: false, error: true });
          return;
        }
        const posts: BlogPost[] = data.items.map((item: Record<string, unknown>) => ({
          title: (item.title as string) ?? "Untitled",
          link: (item.link as string) ?? BLOG_URL,
          pubDate: (item.pubDate as string) ?? "",
          description: stripHtml((item.description as string) ?? "").slice(0, 180),
          thumbnail: extractThumbnail(item),
        }));
        setState({ posts, loading: false, error: false });
      })
      .catch(() => {
        if (!cancelled) setState({ posts: [], loading: false, error: true });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
