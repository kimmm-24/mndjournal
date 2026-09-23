import type { Locale } from "./locale";
import * as NAMESPACES from "./messages/all";

/**
 * UI text, by namespace (registered in ./messages/all.ts). Components read one
 * namespace at a time: `const t = useT("dashboard")` → `t.title`,
 * `t.tradesCount(n)`. Server error messages are translated separately, in
 * ./server-errors.ts.
 */
export type Namespace = keyof typeof NAMESPACES;
export type Messages<N extends Namespace> = (typeof NAMESPACES)[N]["en"];

export const messagesFor = <N extends Namespace>(namespace: N, locale: Locale): Messages<N> =>
  NAMESPACES[namespace][locale] as Messages<N>;

export * from "./locale";
