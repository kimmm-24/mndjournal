import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageSwitch } from "./language-switch";

/** The centered logo card the login/signup/password pages share. */
export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <div className="absolute right-4 top-4">
        <LanguageSwitch compact />
      </div>
      <Card className="w-80">
        <CardContent className="space-y-3 pt-6">
          <div className="text-center">
            <Image
              src="/logo.png"
              alt="mndjournal"
              width={262}
              height={238}
              className="mx-auto mb-2 h-7 w-auto"
            />
            <h1 className="text-sm font-semibold">{title}</h1>
          </div>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
