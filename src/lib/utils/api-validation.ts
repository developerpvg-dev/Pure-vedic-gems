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
    default:
      return message;
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

export function getApiErrorMessage(payload: { error?: string; details?: unknown }, fallback: string) {
  const fieldErrors = mapApiFieldErrors(payload.details);
  const firstFieldError = Object.values(fieldErrors)[0];
  if (firstFieldError) return firstFieldError;
  if (payload.error && payload.error !== 'Validation failed') return payload.error;
  return fallback;
}
