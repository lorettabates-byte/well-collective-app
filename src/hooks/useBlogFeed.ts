import { useEffect, useState } from “react”;
import { decodeEntities, stripHtml } from “../utils/format”;

export const BLOG_URL = “https://lorettabates.com/videolibrary.lorettabates.com/blog/”;

const API_URL = “https://lorettabates.com/videolibrary.lorettabates.com/wp-json/wp/v2/posts?_embed&per_page=10”;

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

interface WpMediaDetails {
  sizes?: Record<string, { source_url?: string }>;
  source_url?: string;
}

interface WpPost {
  link: string;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  _embedded?: {
    "wp:featuredmedia"?: { source_url?: string; media_details?: WpMediaDetails }[];
  };
}

function extractThumbnail(post: WpPost): string | null {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (!media) return null;
  return media.media_details?.sizes?.medium_large?.source_url ?? media.source_url ?? null;
}

export function useBlogFeed(): FeedState {
  const [state, setState] = useState<FeedState>({ posts: [], loading: true, error: false });

  useEffect(() => {
    let cancelled = false;

    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("bad response");
        return res.json();
      })
      .then((data: WpPost[]) => {
        if (cancelled) return;
        if (!Array.isArray(data)) {
          setState({ posts: [], loading: false, error: true });
          return;
        }
        const posts: BlogPost[] = data.map((post) => ({
          title: decodeEntities(stripHtml(post.title?.rendered ?? "Untitled")),
          link: post.link,
          pubDate: post.date,
          description: decodeEntities(stripHtml(post.excerpt?.rendered ?? "")).slice(0, 180),
          thumbnail: extractThumbnail(post),
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
