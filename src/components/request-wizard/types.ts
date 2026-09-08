import type { ServiceCategory, UrgencyLevel } from "@/lib/categories";
import type { AddressInput } from "@/lib/validations/request";

export interface SavedAddress {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

export interface WizardState {
  category: ServiceCategory | null;
  description: string;
  photos: string[];
  urgency: UrgencyLevel | null;
  addressId: string | null;
  newAddress: AddressInput | null;
}

export const INITIAL_WIZARD_STATE: WizardState = {
  category: null,
  description: "",
  photos: [],
  urgency: null,
  addressId: null,
  newAddress: null,
};

export const WIZARD_STEPS = ["Service", "Details", "Timing", "Address", "Review"] as const;

export const EMPTY_ADDRESS: AddressInput = {
  label: "Home",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
};
