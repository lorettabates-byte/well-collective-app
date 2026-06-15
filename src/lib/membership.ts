const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

export async function checkMembershipStatus(email: string): Promise<boolean> {
  if (!API_URL) return true; // fail open if backend not configured

  try {
    const res = await fetch(`${API_URL}/api/membership/status?email=${encodeURIComponent(email)}`);
    if (!res.ok) return true; // fail open
    const data = (await res.json()) as { active?: boolean };
    return data.active !== false;
  } catch {
    return true; // fail open on network error
  }
}
