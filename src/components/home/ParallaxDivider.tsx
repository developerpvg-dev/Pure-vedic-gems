import Image from 'next/image';

interface ParallaxDividerProps {
  image: string;
  quote: string;
  author?: string;
  height?: string;
}

export function ParallaxDivider({
  image,
  quote,
  author,
  height = '360px',
}: ParallaxDividerProps) {
  return (
    <section
      className="relative flex items-center justify-center overflow-hidden"
      style={{ height }}
    >
      {/* Background image with a fixed-style effect via transform */}
      <div className="absolute inset-0">
        <Image
          src={image}
          alt=""
          fill
          className="object-cover"
          style={{ objectPosition: 'center 40%' }}
        />
      </div>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/55" />
      {/* Decorative corner ornaments */}
      <div className="absolute left-6 top-6 h-12 w-12 border-l-2 border-t-2 opacity-40" style={{ borderColor: 'var(--accent)' }} />
      <div className="absolute right-6 top-6 h-12 w-12 border-r-2 border-t-2 opacity-40" style={{ borderColor: 'var(--accent)' }} />
      <div className="absolute bottom-6 left-6 h-12 w-12 border-b-2 border-l-2 opacity-40" style={{ borderColor: 'var(--accent)' }} />
      <div className="absolute bottom-6 right-6 h-12 w-12 border-b-2 border-r-2 opacity-40" style={{ borderColor: 'var(--accent)' }} />
      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl px-8 text-center">
        {/* Decorative gem symbol */}
        <p className="mb-4 text-3xl" style={{ color: 'var(--accent)' }}>
          ◆
        </p>
        <blockquote
          className="font-heading text-xl font-medium italic leading-relaxed text-white md:text-2xl lg:text-3xl"
          style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
        >
          &ldquo;{quote}&rdquo;
        </blockquote>
        {author && (
          <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-white/60">
            — {author}
          </p>
        )}
        <p className="mt-4 text-3xl" style={{ color: 'var(--accent)' }}>
          ◆
        </p>
      </div>
    </section>
  );
}
