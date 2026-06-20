const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export function fixKoreanMarkdownBold(text: string): string {
  if (!text) return text;
  // Match code blocks to skip them, or **bold** immediately followed by a Korean particle
  return text.replace(/(```[\s\S]*?```|`[^`]+`)|(\*\*([^*\n]+)\*\*(?=[가-힣]))/g, (match, code, boldPattern, boldText) => {
    if (code) return code; // Skip code blocks
    return `<strong>${boldText}</strong>`;
  });
}
