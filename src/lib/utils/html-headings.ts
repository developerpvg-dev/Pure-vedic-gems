/** Keeps a page's visible H1 out of CMS-provided body HTML. */
export function demoteBodyH1s(html: string) {
  return html.replace(/<h1\b([^>]*)>/gi, '<h2$1>').replace(/<\/h1>/gi, '</h2>');
}

/** Drop embeds from product description HTML (YouTube iframes, video tags, etc.). */
export function stripHtmlVideos(html: string) {
  // ponytail: regex strip; DOMParser if nested/malformed embeds appear
  return html
    .replace(/<(iframe|video|embed|object)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(iframe|video|embed|object)\b[^>]*\/?\s*>/gi, '');
}
