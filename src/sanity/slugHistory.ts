import { useDocumentOperation, type DocumentActionComponent } from 'sanity';

type SlugDoc = { slug?: { current?: string }; previousSlugs?: string[] };

/** Wraps Publish: when a published slug changes, keep the old one in previousSlugs so old links 301. */
export function withSlugHistory(PublishAction: DocumentActionComponent): DocumentActionComponent {
  const Wrapped: DocumentActionComponent = (props) => {
    const original = PublishAction(props);
    const { patch } = useDocumentOperation(props.id, props.type);
    if (!original) return original;
    return {
      ...original,
      onHandle: () => {
        const draft = props.draft as SlugDoc | null;
        const published = props.published as SlugDoc | null;
        const oldSlug = published?.slug?.current;
        const newSlug = draft?.slug?.current;
        // Publish copies the draft over the live doc — always merge so history is never dropped.
        const history = new Set([...(published?.previousSlugs ?? []), ...(draft?.previousSlugs ?? [])]);
        if (oldSlug) history.add(oldSlug);
        if (newSlug) history.delete(newSlug);
        const next = [...history];
        if (draft && next.join('\n') !== (draft.previousSlugs ?? []).join('\n')) {
          patch.execute([{ set: { previousSlugs: next } }]);
        }
        original.onHandle?.();
      },
    };
  };
  Wrapped.action = PublishAction.action;
  return Wrapped;
}
