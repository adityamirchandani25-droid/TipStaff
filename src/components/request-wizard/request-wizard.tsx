"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CATEGORY_LABELS, URGENCY_LABELS } from "@/lib/categories";
import type { ServiceEstimates } from "@/lib/pricing";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, Loader2, Check, LockKeyhole } from "lucide-react";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { Button } from "@/components/ui/button";
import { CategoryStep } from "@/components/request-wizard/category-step";
import { DetailsStep } from "@/components/request-wizard/details-step";
import { UrgencyStep } from "@/components/request-wizard/urgency-step";
import { AddressStep } from "@/components/request-wizard/address-step";
import {
  INITIAL_WIZARD_STATE,
  EMPTY_ADDRESS,
  WIZARD_STEPS,
  type SavedAddress,
  type WizardState,
} from "@/components/request-wizard/types";
import { addressInputSchema, type AddressInput } from "@/lib/validations/request";
import { createServiceRequest } from "@/lib/actions/requests";

export function RequestWizard({
  addresses,
  estimates,
  initialDescription,
  initialCategory,
  initialUrgency,
}: {
  addresses: SavedAddress[];
  estimates: ServiceEstimates;
  initialDescription?: string;
  initialCategory?: WizardState["category"];
  initialUrgency?: WizardState["urgency"];
}) {
  const router = useRouter();
  const [step, setStep] = useState(initialCategory ? 1 : 0);
  const reducedMotion = useReducedMotion();
  const focusStep = useCallback((node: HTMLDivElement | null) => { node?.focus({ preventScroll: true }); }, []);
  const [state, setState] = useState<WizardState>({
    ...INITIAL_WIZARD_STATE,
    description: initialDescription ?? "",
    category: initialCategory ?? null,
    urgency: initialUrgency ?? null,
    addressId: addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null,
  });
  const [addingNew, setAddingNew] = useState(addresses.length === 0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof AddressInput, string>>>(
    {},
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function goNext() {
    setStepError(null);
    if (step === 0 && !state.category) {
      setStepError("Pick a category to continue.");
      return;
    }
    if (step === 1 && (state.description.trim().length < 10 || state.description.trim().length > 1000)) {
      setStepError("A few more details help your pro show up prepared.");
      return;
    }
    if (step === 2 && !state.urgency) {
      setStepError("Choose how urgent this is.");
      return;
    }
    if (step === 3 && !validateAddress()) return;
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  }

  function goBack() {
    setStepError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function validateAddress() {
    if (!addingNew && state.addressId) return true;
    const parsed = addressInputSchema.safeParse(state.newAddress ?? EMPTY_ADDRESS);
    if (parsed.success) { setAddressErrors({}); return true; }
    const fieldErrors: Partial<Record<keyof AddressInput, string>> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as keyof AddressInput] = issue.message;
    setAddressErrors(fieldErrors);
    return false;
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitError(null);
    const { category, urgency } = state;
    if (!category || !urgency) {
      setSubmitError("Please complete the previous steps.");
      return;
    }

    let addressId: string | undefined;
    let newAddress: AddressInput | undefined;

    if (!addingNew && state.addressId) {
      addressId = state.addressId;
    } else {
      const parsed = addressInputSchema.safeParse(state.newAddress ?? EMPTY_ADDRESS);
      if (!parsed.success) {
        const fieldErrors: Partial<Record<keyof AddressInput, string>> = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path[0] as keyof AddressInput;
          fieldErrors[key] = issue.message;
        }
        setAddressErrors(fieldErrors);
        return;
      }
      setAddressErrors({});
      newAddress = parsed.data;
    }

    setSubmitting(true);
    try {
    const result = await createServiceRequest({
      category,
      description: state.description,
      urgency,
      photos: state.photos,
      addressId,
      newAddress,
    });
    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(result.error ?? "Something went wrong. Try again.");
      return;
    }
    router.push(`/request/${result.requestId}`);
    } catch {
      setSubmitError("Your request couldn’t be sent. Your details are still here — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedAddress = addingNew ? state.newAddress : addresses.find(a => a.id === state.addressId);
  const estimate = state.category && state.urgency ? estimates[state.category][state.urgency] : null;
  const isLastStep = step === WIZARD_STEPS.length - 1;

  return (
    <div className="request-workspace">
      <Link href="/dashboard" className="request-back-link"><ChevronLeft size={15} /> My requests</Link>
      <div className="request-page-heading"><h1>New service request</h1><span>Step {step + 1} of {WIZARD_STEPS.length}</span></div>
      <div className="request-layout"><div className="request-form">
      <ProgressSteps steps={[...WIZARD_STEPS]} current={step} />

      <div className="relative mt-8 min-h-[350px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            ref={focusStep}
            tabIndex={-1}
            className="request-stage"
            aria-label={WIZARD_STEPS[step]}
            initial={{ opacity: reducedMotion ? 1 : 0, x: reducedMotion ? 0 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: reducedMotion ? 1 : 0, x: reducedMotion ? 0 : -10 }}
            transition={{ duration: reducedMotion ? 0 : 0.15 }}
          >
            {step === 0 && (
              <CategoryStep
                value={state.category}
                onChange={(category) => setState((s) => ({ ...s, category }))}
              />
            )}
            {step === 1 && (
              <DetailsStep
                description={state.description}
                onDescriptionChange={(description) => setState((s) => ({ ...s, description }))}
                photos={state.photos}
                onPhotosChange={(photos) => setState((s) => ({ ...s, photos }))}
                error={stepError ?? undefined}
              />
            )}
            {step === 2 && state.category && (
              <UrgencyStep
                estimates={estimates[state.category]}
                value={state.urgency}
                onChange={(urgency) => setState((s) => ({ ...s, urgency }))}
              />
            )}
            {step === 3 && (
              <AddressStep
                addresses={addresses}
                addressId={state.addressId}
                onSelectAddress={(addressId) => setState((s) => ({ ...s, addressId }))}
                newAddress={state.newAddress ?? EMPTY_ADDRESS}
                onNewAddressChange={(newAddress) => setState((s) => ({ ...s, newAddress }))}
                addingNew={addingNew}
                onToggleAddingNew={(value) => {
                  setAddingNew(value);
                  if (value && !state.newAddress) {
                    setState((s) => ({ ...s, newAddress: EMPTY_ADDRESS }));
                  }
                }}
                errors={addressErrors}
              />
            )}
            {step === 4 && (
              <div className="request-review"><h2>Review your request</h2><p>Check the details before you send. This won’t confirm an appointment or collect payment.</p>
                <div className="review-row"><div><span>Service & timing</span><strong>{state.category && CATEGORY_LABELS[state.category]} · {state.urgency && URGENCY_LABELS[state.urgency]}</strong></div><button type="button" onClick={() => setStep(0)}>Edit service</button><button type="button" onClick={() => setStep(2)}>Edit timing</button></div>
                <div className="review-row"><div><span>Job details</span><p>{state.description}</p>{state.photos.length > 0 && <small>{state.photos.length} photo{state.photos.length > 1 ? "s" : ""} attached</small>}</div><button type="button" onClick={() => setStep(1)}>Edit</button></div>
                <div className="review-row"><div><span>Service address</span><p>{selectedAddress?.line1}{selectedAddress?.line2 ? `, ${selectedAddress.line2}` : ""}<br />{selectedAddress?.city}, {selectedAddress?.state} {selectedAddress?.postalCode}</p></div><button type="button" onClick={() => setStep(3)}>Edit</button></div>
                <div className="review-next"><Check size={18} /><p>Your request will be saved in My requests. Worker assignment and arrival time are still to be confirmed.</p></div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {stepError && step !== 1 && <p role="alert" className="mt-4 text-[13px] text-red-600">{stepError}</p>}
      {submitError && <p role="alert" className="mt-4 text-[13px] text-red-600">{submitError}</p>}

      <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
        <Button variant="ghost" onClick={goBack} disabled={step === 0 || submitting}>
          <ChevronLeft className="h-4 w-4" strokeWidth={2} /> Back
        </Button>
        {!isLastStep ? (
          <Button onClick={goNext}>
            {step === 3 ? "Review request" : "Continue"} <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Submitting..." : "Send request"}
          </Button>
        )}
      </div>
      </div><aside className="request-sidebar"><h2>Request summary</h2><dl><div><dt>Service</dt><dd>{state.category ? CATEGORY_LABELS[state.category] : "Not selected"}</dd></div><div><dt>Timing</dt><dd>{state.urgency ? URGENCY_LABELS[state.urgency] : "Not selected"}</dd></div></dl><div className="request-summary-price"><span>Callout + first hour estimate</span><strong>{estimate ? `$${estimate.low}–$${estimate.high}` : "Choose a service and timing"}</strong><p>Parts and extra time are additional. The final cost depends on the work required.</p></div><div className="payment-note"><LockKeyhole size={16} /><span>No payment is collected with this request.</span></div><p className="request-timing-note">Requested timing is subject to worker availability.</p></aside></div>
    </div>
  );
}
