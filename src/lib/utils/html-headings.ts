/** Keeps a page's visible H1 out of CMS-provided body HTML. */
export function demoteBodyH1s(html: string) {
  return html.replace(/<h1\b([^>]*)>/gi, '<h2$1>').replace(/<\/h1>/gi, '</h2>');
}
