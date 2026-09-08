import type { CategoryHubFaq } from '@/components/shop/CategoryHub';

/** Accordion FAQ block for category product listings (bottom of page). */
export function CategoryFaqSection({
  faqs,
  title = 'Frequently Asked Questions',
}: {
  faqs: CategoryHubFaq[];
  title?: string;
}) {
  if (!faqs.length) return null;

  return (
    <section id="faqs" className="category-hub-faq-section scroll-mt-28" aria-labelledby="category-faqs-heading">
      <h2 id="category-faqs-heading" className="category-hub-faq-section__title">
        {title}
      </h2>
      <div className="category-hub-faq-list">
        {faqs.map((faq) => (
          <details key={faq.question} className="category-hub-faq-item">
            <summary className="category-hub-faq-question">
              <h3>{faq.question}</h3>
            </summary>
            <p className="category-hub-faq-answer">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
