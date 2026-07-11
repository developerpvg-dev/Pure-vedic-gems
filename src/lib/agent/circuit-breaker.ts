let failures = 0;
let openUntil = 0;

export function recordAgentFailure() {
  failures += 1;
  if (failures >= 3) {
    openUntil = Date.now() + 60_000;
    failures = 0;
  }
}

export function recordAgentSuccess() {
  failures = 0;
}

export function isAgentCircuitOpen() {
  return Date.now() < openUntil;
}

export function getAgentBusyMessage(locale: 'en' | 'hi') {
  if (locale === 'hi') {
    return 'क्षमा करें, Ratna अभी व्यस्त है। कृपया कुछ क्षण बाद पुनः प्रयास करें या WhatsApp पर संपर्क करें।';
  }
  return 'Sorry, Ratna is briefly busy. Please try again in a moment or contact us on WhatsApp.';
}
