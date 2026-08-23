/** Pure scroll progress 0..1. max<=0 = layout not ready → 0 (not "fully scrolled"). */
export function blogScrollRatio(top: number, scrollHeight: number, innerHeight: number) {
  const max = scrollHeight - innerHeight;
  if (max <= 0) return 0;
  return top / max;
}
