const YT_ID = /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|shorts\/|live\/|watch\?v=)|youtu\.be\/)([\w-]{11})/;
const YT_URL =
  /https?:\/\/(?:www\.)?(?:youtube(?:-nocookie)?\.com\/(?:embed\/|shorts\/|live\/|watch\?v=[\w-]+)|youtu\.be\/[\w-]+)[^\s<]*/i;
const IFRAME = /<iframe\b[\s\S]*?<\/iframe>/i;

export type YoutubeEmbed = { id: string; portrait: boolean; rest: string };

/** Pull a YouTube id out of an iframe paste or a paragraph that is only a watch URL. */
export function youtubeEmbedFromText(text: string): YoutubeEmbed | null {
  const iframe = text.match(IFRAME)?.[0];
  const hay = iframe ?? text;
  const id = hay.match(YT_ID)?.[1];
  if (!id) return null;

  const portraitFromSize = (html: string) => {
    const w = Number(html.match(/\bwidth=["'](\d+)/i)?.[1]);
    const h = Number(html.match(/\bheight=["'](\d+)/i)?.[1]);
    return Boolean(w && h && h > w);
  };

  if (iframe) {
    const rest = text.replace(iframe, '').replace(/\bwatch:\s*/i, '').trim();
    return { id, portrait: portraitFromSize(iframe) || /\/shorts\//.test(iframe), rest };
  }

  const rest = text.replace(YT_URL, '').replace(/\bwatch:\s*/i, '').trim();
  // ponytail: only auto-embed when the paragraph is the URL itself, not a mention in a sentence
  if (rest) return null;
  return { id, portrait: /\/shorts\//.test(text), rest: '' };
}
