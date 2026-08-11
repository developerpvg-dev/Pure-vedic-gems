type ApiFieldErrors = Record<string, string[] | undefined>;

const FIELD_LABELS: Record<string, string> = {
  full_name: 'Name',
  email: 'Email',
  phone: 'Phone',
  date_of_birth: 'Date of birth',
  birth_time: 'Birth time',
  birth_place: 'Birth place',
  life_situation: 'Purpose',
  preferred_date: 'Preferred date',
  preferred_time: 'Preferred time',
  message: 'Message',
  contact: 'Customer',
  customer_address: 'Billing address',
  shipping_address: 'Shipping address',
  shipping_method: 'Shipping method',
  items: 'Items',
  payment: 'Payment',
  billing_gstin: 'Business tax ID',
  pincode: 'Pincode',
  manual_discount: 'Manual discount',
  coupon_code: 'Coupon',
  fulfillment_type: 'Fulfillment',
};

function humanizeValidationMessage(field: string, message: string) {
  const label = FIELD_LABELS[field] ?? field.replace(/_/g, ' ');

  switch (message) {
    case 'Invalid date':
      return `Please enter a valid ${label.toLowerCase()}.`;
    case 'Invalid time':
      return `Please enter a valid ${label.toLowerCase()}.`;
    case 'Date of birth cannot be in the future':
      return 'Date of birth cannot be in the future.';
    case 'Preferred date cannot be in the past':
      return 'Preferred date cannot be in the past.';
    case 'Name is required':
      return 'Please enter your full name.';
    case 'Invalid email':
      return 'Please enter a valid email address.';
    case 'Invalid phone':
      return 'Please enter a valid phone number.';
    case 'Invalid input':
    case 'Required':
      return `Please check ${label.toLowerCase()}.`;
    default:
      // Zod nested flatten often buckets under contact/items — prefix if message is generic
      if (message.toLowerCase().includes(label.toLowerCase()) || message.startsWith('Please ')) {
        return message;
      }
      return `${label}: ${message}`;
  }
}

export function mapApiFieldErrors(details: unknown): Record<string, string> {
  if (!details || typeof details !== 'object') return {};

  const fieldErrors: Record<string, string> = {};
  for (const [field, messages] of Object.entries(details as ApiFieldErrors)) {
    const firstMessage = messages?.[0];
    if (!firstMessage) continue;
    fieldErrors[field] = humanizeValidationMessage(field, firstMessage);
  }
  return fieldErrors;
}

export function getApiErrorMessage(
  payload: { error?: string; details?: unknown; formErrors?: unknown },
  fallback: string,
) {
  const fieldErrors = mapApiFieldErrors(payload.details);
  const fromFields = Object.values(fieldErrors);
  const formErrors = Array.isArray(payload.formErrors)
    ? payload.formErrors.filter((m): m is string => typeof m === 'string' && m.trim().length > 0)
    : [];
  const combined = [...fromFields, ...formErrors];
  if (combined.length > 0) return combined.slice(0, 3).join(' · ');
  if (payload.error && payload.error !== 'Validation failed') return payload.error;
  return fallback;
}

/** Build a clear admin-facing message from a Zod failure (API routes). */
export function formatZodValidationError(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>;
  flatten: () => { fieldErrors: ApiFieldErrors; formErrors: string[] };
}) {
  const flat = error.flatten();
  const summary = error.issues
    .slice(0, 3)
    .map((issue) => {
      const leaf = issue.path[issue.path.length - 1];
      const key = typeof leaf === 'string' || typeof leaf === 'number' ? String(leaf) : '';
      return humanizeValidationMessage(key || 'form', issue.message);
    })
    .filter((msg, i, arr) => arr.indexOf(msg) === i)
    .join(' · ');

  return {
    error: summary || 'Validation failed',
    details: flat.fieldErrors,
    formErrors: flat.formErrors,
  };
}
