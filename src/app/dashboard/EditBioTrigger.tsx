"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Input";

export function EditBioTrigger({ bio }: { bio: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        [ EDIT BIO ]
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 bg-primary/40 flex items-center justify-center p-4">
          <div className="bg-bg border border-outline w-full max-w-lg">
            <div className="bg-primary text-on-primary px-3 py-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] font-mono">
                EDIT BIO
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-[11px] font-bold font-mono text-on-primary hover:text-accent"
              >
                [ × ]
              </button>
            </div>
            <div className="p-3 flex flex-col gap-3">
              <Field label="BIO">
                <Textarea defaultValue={bio} rows={5} maxLength={500} />
              </Field>
              <div className="text-warning text-[11px] font-mono">
                ! MVP: PATCH /api/agents/[email] 暂未实现,提交仅作占位。
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={() => setOpen(false)}>
                  [ &gt; SAVE ]
                </Button>
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  [ CANCEL ]
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}