import test from "node:test";
import assert from "node:assert/strict";
import { filterDirectoryListings, type DirectoryListing } from "../src/lib/directory";

const listings: DirectoryListing[] = [
  {
    id: "provider-1",
    name: "Morgan Lee",
    companyId: "company-1",
    companyName: "Northside Home Services",
    categories: ["PLUMBING", "HVAC"],
    bio: "Water heater and cooling specialist",
    lat: 33.9,
    lng: -84.3,
    distanceMi: 4.2,
    rating: 4.9,
    ratingCount: 20,
    jobsCompleted: 25,
  },
  {
    id: "provider-2",
    name: "Taylor Reed",
    companyId: null,
    companyName: null,
    categories: ["ELECTRICAL"],
    bio: null,
    lat: 34.0,
    lng: -84.2,
    distanceMi: 7.1,
    rating: 0,
    ratingCount: 0,
    jobsCompleted: 0,
  },
];

test("directory filters the live API response by supported service", () => {
  assert.deepEqual(filterDirectoryListings(listings, "PLUMBING").map(item => item.id), ["provider-1"]);
  assert.deepEqual(filterDirectoryListings(listings, "ELECTRICAL").map(item => item.id), ["provider-2"]);
  assert.equal(filterDirectoryListings(listings, "ROOFING").length, 0);
});

test("directory search covers provider, company, category, and bio", () => {
  assert.equal(filterDirectoryListings(listings, "ALL", "MORGAN")[0].id, "provider-1");
  assert.equal(filterDirectoryListings(listings, "ALL", "northside")[0].id, "provider-1");
  assert.equal(filterDirectoryListings(listings, "ALL", "water heater")[0].id, "provider-1");
  assert.equal(filterDirectoryListings(listings, "ALL", "electrical")[0].id, "provider-2");
  assert.equal(filterDirectoryListings(listings, "ALL", "not-a-provider").length, 0);
});

test("directory filtering never mutates or fabricates API listings", () => {
  const result = filterDirectoryListings(listings, "ALL");
  assert.deepEqual(result, listings);
  assert.equal(new Set(result.map(item => item.id)).size, result.length);
  assert.ok(result.every(item => item.lat >= -90 && item.lat <= 90));
  assert.ok(result.every(item => item.lng >= -180 && item.lng <= 180));
});
