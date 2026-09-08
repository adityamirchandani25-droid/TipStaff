import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { authConfig } from "../src/lib/auth.config";
import { accountHome, safeCustomerCallback } from "../src/lib/auth-routing";

function authorize(path: string, role?: "CUSTOMER" | "PROVIDER") {
  return authConfig.callbacks.authorized({
    auth: role ? { user: { id: "test", role, name: "Test" }, expires: "2099-01-01" } : null,
    request: new NextRequest(`https://tipstaff.local${path}`),
  });
}
function location(result: boolean | Response) {
  assert.ok(result instanceof Response);
  return result.headers.get("location");
}

test("each portal has a separate protected destination", () => {
  assert.equal(accountHome("PROVIDER"), "/worker/dashboard");
  assert.equal(accountHome("CUSTOMER"), "/dashboard");
  assert.equal(authorize("/worker/login"), true);
  assert.equal(authorize("/worker/signup"), true);
  assert.equal(location(authorize("/worker/dashboard")), "https://tipstaff.local/worker/login");
  assert.match(location(authorize("/request/new?category=PLUMBING"))!, /\/login\?callbackUrl=/);
});

test("customers and workers cannot enter each other’s workspace", () => {
  assert.equal(authorize("/dashboard", "CUSTOMER"), true);
  assert.equal(authorize("/worker/dashboard", "PROVIDER"), true);
  assert.equal(location(authorize("/worker/dashboard", "CUSTOMER")), "https://tipstaff.local/dashboard");
  assert.equal(location(authorize("/request/new", "PROVIDER")), "https://tipstaff.local/worker/dashboard");
});

test("booking callbacks retain category and search but reject unsafe destinations", () => {
  assert.equal(safeCustomerCallback("/request/new?category=PLUMBING&q=leak"), "/request/new?category=PLUMBING&q=leak");
  for (const raw of ["//evil.example", "/\\evil.example", "https://evil.example", "/worker/dashboard", "/api/auth/signout", "/request/../../worker/dashboard", undefined]) {
    assert.equal(safeCustomerCallback(raw), "/dashboard");
  }
});

test("proxy sessions retain the database-backed role from the token", () => {
  const args = { session: { user: {}, expires: "2099-01-01" }, token: { id: "worker-id", role: "PROVIDER" } };
  const session = authConfig.callbacks.session(args as Parameters<typeof authConfig.callbacks.session>[0]);
  assert.equal(session.user.role, "PROVIDER");
  assert.equal(session.user.id, "worker-id");
});
