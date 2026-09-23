"use client";

import { useEffect, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createDictationSession, type SpeechRecognizer } from "@/lib/dictation";
import { useI18n, useT } from "./i18n";

/** Browser speech recognition requires microphone permission and sometimes a network service. */
export function VoiceNote({
  onText,
  onPrepare,
}: {
  onText: (text: string) => void;
  onPrepare: () => void;
}) {
  const t = useT("editor").voice;
  const { locale } = useI18n();
  const errorText = (code: string) => {
    switch (code) {
      case "not-allowed":
      case "service-not-allowed":
        return t.errors.blocked;
      case "audio-capture":
        return t.errors.noMic;
      case "no-speech":
        return t.errors.noSpeech;
      case "network":
        return t.errors.network;
      case "language-not-supported":
        return t.errors.language;
      default:
        return t.errors.start;
    }
  };
  const [state, setState] = useState<"idle" | "starting" | "listening">("idle");
  const [error, setError] = useState("");
  const [keyboardHint, setKeyboardHint] = useState(false);
  const callback = useRef(onText);
  callback.current = onText;
  const session = useRef<ReturnType<typeof createDictationSession> | null>(null);
  useEffect(() => () => session.current?.dispose(), []);

  const showError = (message: string) => {
    setError(message);
  };
  const toggle = () => {
    if (state !== "idle") {
      session.current?.stop();
      return;
    }
    session.current?.dispose();
    setKeyboardHint(false);
    setError("");
    onPrepare();
    const speechWindow = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognizer;
      webkitSpeechRecognition?: new () => SpeechRecognizer;
    };
    const Constructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Constructor) {
      showError(t.unsupported);
      return;
    }
    try {
      session.current = createDictationSession(
        new Constructor(),
        {
          onText: (text) => callback.current(text),
          onState: setState,
          onError: showError,
        },
        // Listen in the app's language: Indonesian UI, Indonesian speech.
        locale === "id" ? "id-ID" : navigator.language || "en-US",
        errorText,
      );
      session.current.start();
    } catch {
      showError(errorText("start"));
    }
  };

  return (
    <Popover.Root
      open={Boolean(error)}
      onOpenChange={(open) => {
        if (!open) setError("");
      }}
    >
      <div className="relative shrink-0">
        <Popover.Anchor asChild>
          <Button
            type="button"
            variant={state === "idle" ? "outline" : "destructive"}
            size="sm"
            onClick={toggle}
            aria-pressed={state !== "idle"}
            title={state === "idle" ? t.dictateHint : t.stop}
          >
            {state === "idle" ? <Mic /> : <MicOff />}
            {state === "starting" ? t.starting : state === "listening" ? t.listening : t.dictate}
          </Button>
        </Popover.Anchor>
        <Popover.Portal>
          <Popover.Content
            aria-label={t.help}
            align="end"
            sideOffset={8}
            collisionPadding={12}
            onCloseAutoFocus={(event) => {
              if (keyboardHint) {
                event.preventDefault();
                onPrepare();
              }
            }}
            className="journal-popup z-50 max-h-[var(--radix-popover-content-available-height)] w-80 max-w-[calc(100vw-24px)] space-y-3 overflow-y-auto rounded-xl border bg-card p-4 text-sm shadow-lg"
          >
            <p role="alert">{error}</p>
            <p className="text-muted-foreground">{t.keyboardHelp}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  session.current?.dispose();
                  setError("");
                  setKeyboardHint(true);
                  onPrepare();
                }}
              >
                {t.useKeyboard}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setError("")}>
                {t.dismiss}
              </Button>
            </div>
          </Popover.Content>
        </Popover.Portal>
        {keyboardHint && (
          <span role="status" className="sr-only">
            {t.ready}
          </span>
        )}
      </div>
    </Popover.Root>
  );
}
