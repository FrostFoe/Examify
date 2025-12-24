"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  onConfirm: (password: string) => Promise<void> | void;
}

export default function ConfirmPasswordDialog({
  open,
  onOpenChange,
  title = "অ্যাডমিন পদক্ষেপ নিশ্চিত করুন",
  description,
  confirmLabel = "নিশ্চিত করুন",
  onConfirm,
}: Props) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(password);
    } finally {
      setLoading(false);
      setPassword("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : (
            <DialogDescription>
              এই কাজটি নিশ্চিত করতে অনুগ্রহ করে আপনার অ্যাডমিন পাসওয়ার্ড দিন।
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-4">
          <Input
            type="password"
            placeholder="অ্যাডমিন পাসওয়ার্ড"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            বাতিল
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!password || loading}
          >
            {loading ? "যাচাই করা হচ্ছে..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
