/**
 * One namespace of UI text, both languages side by side so they're reviewed
 * and edited together. `id` must have exactly `en`'s shape — a missing,
 * extra, or differently-typed entry (including a function's parameters) is a
 * type error, so a translation can't silently go missing.
 */
export const defineMessages = <T extends object>(messages: { en: T; id: NoInfer<T> }) => messages;
