import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Shell } from "@/components/shell";
import { I18nProvider } from "@/components/i18n";
import { LOCALE_COOKIE, localeFromCookie } from "@/lib/i18n";
import { PrivacyProvider } from "@/components/privacy";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  title: "mndjournal",
  description:
    "mndjournal — broker sync, deep analytics, daily journaling, and AI-native reflection for traders.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading the cookie makes every page render per request — needed so the
  // first paint is already in the user's language.
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = localeFromCookie(cookie ? `${LOCALE_COOKIE}=${cookie}` : null);
  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <TooltipProvider delayDuration={350} skipDelayDuration={150}>
          <Suspense>
            <I18nProvider initialLocale={locale}>
              <ThemeProvider>
                <PrivacyProvider>
                  <Shell>{children}</Shell>
                </PrivacyProvider>
              </ThemeProvider>
            </I18nProvider>
          </Suspense>
        </TooltipProvider>
      </body>
    </html>
  );
}
