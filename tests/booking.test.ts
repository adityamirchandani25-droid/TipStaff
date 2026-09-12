import test from "node:test";
import assert from "node:assert/strict";
import { estimateAllServices, estimatePriceRange } from "../src/lib/pricing";
import { CATEGORY_ORDER, URGENCY_ORDER } from "../src/lib/categories";
import { createRequestSchema } from "../src/lib/validations/request";

const base = { category: "PLUMBING", urgency: "THIS_WEEK", description: "The kitchen tap is leaking.", addressId: "test-address", paymentIntentId: "pi_test_123" };
test("the displayed price table agrees with request pricing for every choice", () => {
  const at = new Date(2026, 8, 7, 15, 0);
  const table = estimateAllServices(at);
  for (const category of CATEGORY_ORDER) for (const urgency of URGENCY_ORDER) {
    assert.deepEqual(table[category][urgency], estimatePriceRange(category, urgency, at));
  }
  assert.deepEqual(table.PLUMBING.THIS_WEEK, { low: 164, high: 239, surgeMultiplier: 1 });
  assert.ok(table.PLUMBING.EMERGENCY.low > table.PLUMBING.THIS_WEEK.low);
});
test("photo inputs accept supported uploads and reject non-image URLs or oversized data", () => {
  assert.equal(createRequestSchema.safeParse({ ...base, photos: ["data:image/jpeg;base64,aGVsbG8="] }).success, true);
  for (const photo of ["https://example.com/photo.jpg", "data:image/svg+xml;base64,aGVsbG8=", "data:image/png;base64," + "a".repeat(5_600_001)]) {
    assert.equal(createRequestSchema.safeParse({ ...base, photos: [photo] }).success, false);
  }
  assert.equal(createRequestSchema.safeParse({ ...base, photos: Array(4).fill("data:image/png;base64,aGVsbG8=") }).success, false);
});
test("requests require useful details and valid category and timing", () => {
  assert.equal(createRequestSchema.safeParse(base).success, true);
  assert.equal(createRequestSchema.safeParse({ ...base, description: "" }).success, false);
  assert.equal(createRequestSchema.safeParse({ ...base, category: "UNKNOWN" }).success, false);
  assert.equal(createRequestSchema.safeParse({ ...base, urgency: "SOMETIME" }).success, false);
});
test("a request can't be created without a payment intent", () => {
  const withoutPayment = { category: base.category, urgency: base.urgency, description: base.description, addressId: base.addressId };
  assert.equal(createRequestSchema.safeParse(withoutPayment).success, false);
  assert.equal(createRequestSchema.safeParse({ ...base, paymentIntentId: "" }).success, false);
});
