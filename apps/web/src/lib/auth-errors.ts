/**
 * Better Auth client errors carry a stable `code` (e.g. INVALID_EMAIL_OR_PASSWORD);
 * the translated message is looked up by it. Unknown codes fall back to Better
 * Auth's own (English) message, then to the caller's generic fallback.
 */
export const authErrorMessage = (
  error: { code?: string; message?: string },
  messages: Record<string, string>,
  fallback: string,
): string => (error.code && messages[error.code]) || error.message || fallback;
