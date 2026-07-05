// Parse @mentions from text and extract mentioned usernames
export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = text.matchAll(mentionRegex);
  return Array.from(matches, (m) => m[1]);
}

// Find current @ mention being typed at cursor position
export interface CurrentMention {
  start: number;
  end: number;
  query: string;
}

export function getCurrentMention(text: string, cursorPos: number): CurrentMention | null {
  // Look backwards from cursor to find @
  let start = cursorPos - 1;
  while (start >= 0 && /\w/.test(text[start])) {
    start--;
  }

  if (start >= 0 && text[start] === "@") {
    const query = text.substring(start + 1, cursorPos);
    return { start, end: cursorPos, query };
  }

  return null;
}

// Replace mention at cursor position with selected username
export function replaceMention(text: string, mention: CurrentMention, username: string): string {
  return text.substring(0, mention.start) + "@" + username + " " + text.substring(mention.end);
}

// Format @mention as markdown-style link
export function formatMentions(text: string, userMap: Record<string, { name: string; id: string }>): string {
  // Replace @username with [@username](#mention:username) for rendering
  return text.replace(/@(\w+)/g, (match, username) => {
    if (userMap[username]) {
      return `[@${username}](#mention:${username})`;
    }
    return match;
  });
}

// Extract raw mention data from formatted text
export function extractMentionData(text: string): Array<{ username: string; userId?: string }> {
  const mentions: Array<{ username: string; userId?: string }> = [];
  const regex = /@(\w+)/g;
  const matches = text.matchAll(regex);
  for (const match of matches) {
    mentions.push({ username: match[1] });
  }
  return mentions;
}
