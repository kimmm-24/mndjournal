"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ManualTradeEntry } from "./manual-trade-entry";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { useT } from "./i18n";

export function AddTradeDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const t = useT("entry");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-3.5 w-3.5" />
          {t.addTrade}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t.addTrade}</DialogTitle>
          <DialogDescription>{t.dialogBody}</DialogDescription>
        </DialogHeader>
        <ManualTradeEntry
          onSaved={() => {
            setOpen(false);
            onSaved();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
