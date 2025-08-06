// Vercel imposes a 14KB URL length limit (https://vercel.com/docs/errors/URL_TOO_LONG)
// We use a POST request to avoid this limit if message is too long.
export const MAX_MESSAGE_LENGTH = 25_000; // ~14KB

export function isMessageTooLong(message: string) {
  return message && message.length > MAX_MESSAGE_LENGTH;
}
