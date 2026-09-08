import { Plus, Home } from "lucide-react";
import { US_STATES } from "@/lib/us-states";
import type { SavedAddress } from "@/components/request-wizard/types";
import type { AddressInput } from "@/lib/validations/request";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export function AddressStep({
  addresses,
  addressId,
  onSelectAddress,
  newAddress,
  onNewAddressChange,
  addingNew,
  onToggleAddingNew,
  errors,
}: {
  addresses: SavedAddress[];
  addressId: string | null;
  onSelectAddress: (id: string) => void;
  newAddress: AddressInput;
  onNewAddressChange: (address: AddressInput) => void;
  addingNew: boolean;
  onToggleAddingNew: (value: boolean) => void;
  errors: Partial<Record<keyof AddressInput, string>>;
}) {
  function updateField<K extends keyof AddressInput>(key: K, value: AddressInput[K]) {
    onNewAddressChange({ ...newAddress, [key]: value });
  }

  return (
    <div>
      <h2 className="font-display text-2xl tracking-tight text-ink-900">
        Where do you need help?
      </h2>
      <p className="mt-1.5 text-sm text-ink-500">Pick a saved address or add a new one.</p>

      {addresses.length > 0 && (
        <div className="mt-6 flex flex-col gap-2">
          {addresses.map((addr) => (
            <label
              key={addr.id}
              className={cn(
                "flex cursor-pointer focus-within:ring-2 focus-within:ring-brand-500 items-start gap-3 rounded-[var(--radius-lg)] border border-border bg-surface-raised p-4 transition-colors hover:border-ink-300",
                !addingNew && addressId === addr.id && "border-brand-600 ring-2 ring-brand-500/15",
              )}
            >
              <input
                type="radio"
                name="address"
                className="sr-only"
                checked={!addingNew && addressId === addr.id}
                onChange={() => {
                  onSelectAddress(addr.id);
                  onToggleAddingNew(false);
                }}
              />
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-600">
                <Home className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink-900">{addr.label}</span>
                <span className="block text-xs text-ink-500">
                  {addr.line1}
                  {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state}{" "}
                  {addr.postalCode}
                </span>
              </span>
            </label>
          ))}
        </div>
      )}

      {addresses.length > 0 && <button
        type="button"
        onClick={() => onToggleAddingNew(!addingNew)}
        className={cn(
          "mt-3 flex w-full items-center gap-2 rounded-[var(--radius-lg)] border border-dashed p-4 text-sm font-medium transition-colors",
          addingNew
            ? "border-brand-500 bg-brand-50 text-brand-700"
            : "border-ink-300 text-ink-600 hover:border-brand-500 hover:text-brand-700",
        )}
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
        {addingNew ? "Use a saved address" : "Add a new address"}
      </button>}

      {addingNew && (
        <div className="mt-4 flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border bg-surface-raised p-4">
          <Field label="Label" htmlFor="addr-label">
            <Input
              id="addr-label"
              placeholder="Home"
              value={newAddress.label}
              onChange={(e) => updateField("label", e.target.value)}
            />
          </Field>
          <Field label="Street address" htmlFor="addr-line1" error={errors.line1}>
            <Input
              id="addr-line1"
              invalid={!!errors.line1}
              value={newAddress.line1}
              onChange={(e) => updateField("line1", e.target.value)}
            />
          </Field>
          <Field label="Apt / unit (optional)" htmlFor="addr-line2">
            <Input
              id="addr-line2"
              value={newAddress.line2 ?? ""}
              onChange={(e) => updateField("line2", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City" htmlFor="addr-city" error={errors.city}>
              <Input
                id="addr-city"
                invalid={!!errors.city}
                value={newAddress.city}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </Field>
            <Field label="State" htmlFor="addr-state" error={errors.state}>
              <Select
                id="addr-state"
                invalid={!!errors.state}
                value={newAddress.state}
                onChange={(e) => updateField("state", e.target.value)}
              >
                <option value="">Select</option>
                {US_STATES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="ZIP code" htmlFor="addr-zip" error={errors.postalCode}>
            <Input
              id="addr-zip"
              invalid={!!errors.postalCode}
              value={newAddress.postalCode}
              onChange={(e) => updateField("postalCode", e.target.value)}
            />
          </Field>
        </div>
      )}
    </div>
  );
}
