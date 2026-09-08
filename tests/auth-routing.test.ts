import test from "node:test";
import assert from "node:assert/strict";
import { accountHome, safeAuthCallback, safeCustomerCallback } from "../src/lib/auth-routing";

test("each portal has a separate protected destination", () => {
  assert.equal(accountHome("PROVIDER"), "/worker/dashboard");
  assert.equal(accountHome("CUSTOMER"), "/dashboard");
});

test("booking callbacks retain category and search but reject unsafe destinations", () => {
  assert.equal(safeCustomerCallback("/request/new?category=PLUMBING&q=leak"), "/request/new?category=PLUMBING&q=leak");
  for (const raw of ["//evil.example", "/\\evil.example", "https://evil.example", "/worker/dashboard", "/api/auth/signout", "/request/../../worker/dashboard", undefined]) {
    assert.equal(safeCustomerCallback(raw), "/dashboard");
  }
});

test("confirmation callbacks allow only TipStaff account destinations", () => {
  assert.equal(safeAuthCallback("/worker/dashboard", "/dashboard"), "/worker/dashboard");
  assert.equal(safeAuthCallback("/request/new?category=HVAC", "/dashboard"), "/request/new?category=HVAC");
  for (const raw of ["//evil.example", "https://evil.example", "/api/keys", "/services", undefined]) {
    assert.equal(safeAuthCallback(raw, "/worker/dashboard"), "/worker/dashboard");
  }
});
