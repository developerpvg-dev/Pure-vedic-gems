import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';

interface PolicySection {
  title: string;
  content: string;
  items?: string[];
}

interface PolicyArticlePageProps {
  eyebrow: string;
  title: string;
  description: string;
  updated: string;
  sections: PolicySection[];
}

export function PolicyArticlePage({ eyebrow, title, description, updated, sections }: PolicyArticlePageProps) {
  return (
    <>
      <section className="bg-secondary/30 py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <ScrollReveal>
            <span className="font-body text-xs font-semibold uppercase tracking-[5px] text-accent">{eyebrow}</span>
            <h1 className="mt-3 font-heading text-3xl font-bold text-primary md:text-4xl lg:text-5xl">{title}</h1>
            <OrnamentalDivider className="mx-auto mt-3 max-w-sm" />
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-brand-text/85">{description}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[3px] text-brand-text/80">Updated {updated}</p>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-background py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="space-y-6">
            {sections.map((section) => (
              <ScrollReveal key={section.title}>
                <article className="rounded-sm border border-border bg-card p-6 shadow-sm">
                  <h2 className="font-heading text-xl font-semibold text-primary">{section.title}</h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-brand-text/85">{section.content}</p>
                  {section.items && (
                    <ul className="mt-4 space-y-2 text-sm leading-relaxed text-brand-text/85">
                      {section.items.map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                  )}
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}