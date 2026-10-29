import { describe, expect, it } from 'vitest';
import { youtubeEmbedFromText } from '@/lib/blog/youtube-embed';

const iframe =
  '<iframe width="383" height="681" src="https://www.youtube.com/embed/z0FgXLCG-Xg" title="LOOK AT THIS BURMA RUBY THIS IS WHY QUALITY MATTERS" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';

describe('youtubeEmbedFromText', () => {
  it('turns a pasted YouTube iframe into a portrait embed', () => {
    const found = youtubeEmbedFromText(`watch: ${iframe}`);
    expect(found).toEqual({ id: 'z0FgXLCG-Xg', portrait: true, rest: '' });
  });

  it('embeds a bare watch URL', () => {
    expect(youtubeEmbedFromText('https://www.youtube.com/watch?v=OPGl0pGAiT4')).toEqual({
      id: 'OPGl0pGAiT4',
      portrait: false,
      rest: '',
    });
  });

  it('does not steal a YouTube link out of a normal sentence', () => {
    expect(
      youtubeEmbedFromText('Watch more on https://www.youtube.com/watch?v=OPGl0pGAiT4 and then visit the showroom in Saket.'),
    ).toBeNull();
  });
});
