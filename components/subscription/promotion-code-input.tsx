"use client";

import {useActionState, useEffect, useState} from "react";
import {validatePromotionAction, type PromotionValidationActionState} from "@/app/_actions/checkout";
import {Button} from "@/components/ui/button";
import {FieldError} from "@/components/ui/field";
import {formatMoney} from "@/lib/subscription/plans";
import type {PromotionValidationResponse} from "@/lib/api/checkout";

const initial: PromotionValidationActionState = {status: "idle"};

export function PromotionCodeInput({
  selectedPriceId,
  onApplied,
  onDraftChange,
}: {
  selectedPriceId: string;
  onApplied: (promotion: PromotionValidationResponse | null) => void;
  onDraftChange: (hasDraft: boolean) => void;
}) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<PromotionValidationResponse | null>(null);
  const [state, action, isPending] = useActionState(validatePromotionAction, initial);

  useEffect(() => {
    setApplied(null);
    setCode("");
    onApplied(null);
    onDraftChange(false);
  }, [selectedPriceId, onApplied, onDraftChange]);

  useEffect(() => {
    if (state.status === "success" && state.validation) {
      setApplied(state.validation);
      onApplied(state.validation);
      onDraftChange(false);
    }
  }, [state, onApplied, onDraftChange]);

  if (applied) {
    return (
      <div className="grid gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-3">
        <input type="hidden" name="promotionCode" value={applied.promotionCode}/>
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-primary/15 px-2 py-1 text-xs font-black">{applied.promotionCode}</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => { setApplied(null); setCode(""); onApplied(null); onDraftChange(false); }}>
            حذف کد
          </Button>
        </div>
        <p className="text-xs font-bold text-primary">
          {applied.redemptionMode === "FREE_ACTIVATION"
            ? "کد پذیرفته شد؛ برای فعال‌سازی روی «اعمال» بزن."
            : "کد تخفیف اعمال شد."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
      <label className="grid gap-1 text-xs font-bold text-muted-foreground">
        کد تخفیف
        <input name="promotionCodeDraft" value={code} onChange={(event) => { const nextCode = event.target.value; setCode(nextCode); onDraftChange(nextCode.trim().length > 0); }} placeholder="اختیاری" className="h-10 rounded-xl border bg-background px-3 text-sm font-semibold text-foreground" autoComplete="off"/>
      </label>
      <Button type="submit" formAction={action} disabled={isPending} className="self-end">
        {isPending ? "در حال بررسی..." : "اعمال کد"}
      </Button>
      {state.status === "error" ? <FieldError>{state.error}</FieldError> : null}
      <input type="hidden" name="priceId" value={selectedPriceId}/>
    </div>
  );
}
