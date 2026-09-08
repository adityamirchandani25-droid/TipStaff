import test from "node:test";
import assert from "node:assert/strict";
import { DEMO_COMPANIES, filterCompanies, findDirectoryCompany } from "../src/lib/directory";
import { CATEGORY_ORDER } from "../src/lib/categories";

test("every service category returns companies that actually support it", () => {
  for (const category of CATEGORY_ORDER) {
    const companies = filterCompanies(category);
    assert.ok(companies.length > 0, `${category} has listings`);
    assert.ok(companies.every(company => company.categories.includes(category)));
  }
});
test("search is case-insensitive and combines with the selected service", () => {
  assert.equal(filterCompanies("ALL", "CLEARLINE")[0].id, "clearline");
  assert.equal(filterCompanies("PLUMBING", "clearline").length, 1);
  assert.equal(filterCompanies("ELECTRICAL", "clearline").length, 0);
  assert.equal(filterCompanies("ALL", "riverside")[0].id, "homeguard");
  assert.equal(filterCompanies("ALL", "no-matching-company").length, 0);
});
test("map and detail identifiers resolve to the same listings", () => {
  assert.equal(new Set(DEMO_COMPANIES.map(company => company.id)).size, DEMO_COMPANIES.length);
  for (const company of DEMO_COMPANIES) {
    assert.equal(findDirectoryCompany(company.id), company);
    assert.ok(company.lat >= -90 && company.lat <= 90);
    assert.ok(company.lng >= -180 && company.lng <= 180);
  }
});
