import { Browser } from "@capacitor/browser";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

// Opens a lorettabates.com URL, auto-logging the member into WordPress first
// (via a short-lived signed link) so they don't hit a separate WordPress
// login wall when they're already signed into the app. Falls back to the
// raw URL if the SSO link can't be generated for any reason.
export async function openMemberLink(url: string, email: string | undefined): Promise<void> {
  let target = url;

  if (email && API_URL && url.startsWith("https://lorettabates.com")) {
    try {
      const res = await fetch(
        `${API_URL}/api/sso/link?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(url)}`
      );
      if (res.ok) {
        const data = (await res.json()) as { url?: string };
        if (data.url) target = data.url;
      }
    } catch {
      // fall through to raw URL
    }
  }

  await Browser.open({ url: target });
}
