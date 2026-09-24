import assert from "node:assert/strict";
import test from "node:test";

import {
  SESSION_PROFILE_TTL_MS,
  sessionProfileCachePlan,
  TtlCache,
} from "../lib/auth/session-profile-core";

const userToken = {
  status: "verified" as const,
  token: { userId: "11111111-1111-4111-8111-111111111111", role: "USER" as const },
};

const adminToken = {
  status: "verified" as const,
  token: { userId: "22222222-2222-4222-8222-222222222222", role: "ADMIN" as const },
};

test("a verified user token is cached under its own id", () => {
  assert.deepEqual(sessionProfileCachePlan(userToken), {
    cached: true,
    userId: "11111111-1111-4111-8111-111111111111",
  });
});

test("an admin token is never cached, so revocation stays immediate", () => {
  assert.deepEqual(sessionProfileCachePlan(adminToken), {
    cached: false,
    reason: "privileged",
  });
});

test("an unverifiable token is never cached", () => {
  assert.deepEqual(sessionProfileCachePlan({ status: "invalid-token" }), {
    cached: false,
    reason: "unverified",
  });
  assert.deepEqual(sessionProfileCachePlan({ status: "key-unavailable" }), {
    cached: false,
    reason: "unverified",
  });
});

test("a non-admin account change stays invisible for the whole TTL", async () => {
  // Documents an accepted trade, not a bug. Before the cache, getSession read
  // /users/me every render, so a status change took effect on the next one.
  // It can now lag by up to SESSION_PROFILE_TTL_MS.
  //
  // This is bounded by the backend, not by the frontend: JwtAuthFilter checks
  // `status = 'ACTIVE'` in the database on every authenticated request, so a
  // disabled user is refused by the API throughout this window even while the
  // cached profile still reads ACTIVE. If that filter ever stops checking, this
  // window becomes a real authorization hole and the cache must go.
  let clock = 0;
  let status = "ACTIVE";
  const cache = new TtlCache<{ status: string }>(
    SESSION_PROFILE_TTL_MS,
    10,
    () => clock,
  );
  const read = () => cache.load("user-1", async () => ({ status }));

  assert.equal((await read()).status, "ACTIVE");

  status = "DISABLED";
  clock += SESSION_PROFILE_TTL_MS - 1;
  assert.equal((await read()).status, "ACTIVE", "stale within the window");

  clock += 2;
  assert.equal((await read()).status, "DISABLED", "fresh once it expires");
});

test("the stale window stays well under the 15-minute access token TTL", () => {
  assert.ok(
    SESSION_PROFILE_TTL_MS <= 60_000,
    "profile staleness must never become the widest stale window in the system",
  );
});

test("a cached value is reused until it expires, then reloaded", async () => {
  let clock = 1_000;
  let loads = 0;
  const cache = new TtlCache<string>(60_000, 10, () => clock);
  const load = () => cache.load("user-1", async () => `value-${++loads}`);

  assert.equal(await load(), "value-1");
  clock += 59_000;
  assert.equal(await load(), "value-1");
  assert.equal(loads, 1);

  clock += 2_000;
  assert.equal(await load(), "value-2");
  assert.equal(loads, 2);
});

test("concurrent loads of one key share a single request", async () => {
  let loads = 0;
  const cache = new TtlCache<string>(60_000, 10);
  const loader = async () => {
    loads += 1;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return "shared";
  };

  const results = await Promise.all([
    cache.load("user-1", loader),
    cache.load("user-1", loader),
    cache.load("user-1", loader),
  ]);

  assert.deepEqual(results, ["shared", "shared", "shared"]);
  assert.equal(loads, 1);
});

test("different keys never share a value", async () => {
  const cache = new TtlCache<string>(60_000, 10);
  assert.equal(await cache.load("user-1", async () => "one"), "one");
  assert.equal(await cache.load("user-2", async () => "two"), "two");
  assert.equal(await cache.load("user-1", async () => "unused"), "one");
});

test("a failed load is not cached", async () => {
  let attempts = 0;
  const cache = new TtlCache<string>(60_000, 10);
  const loader = async () => {
    attempts += 1;
    if (attempts === 1) throw new Error("boom");
    return "recovered";
  };

  await assert.rejects(() => cache.load("user-1", loader), /boom/);
  assert.equal(cache.size, 0);
  assert.equal(await cache.load("user-1", loader), "recovered");
  assert.equal(attempts, 2);
});

test("delete forces the next read to reload", async () => {
  let loads = 0;
  const cache = new TtlCache<string>(60_000, 10);
  const load = () => cache.load("user-1", async () => `value-${++loads}`);

  assert.equal(await load(), "value-1");
  cache.delete("user-1");
  assert.equal(await load(), "value-2");
});

test("the cache evicts the oldest entry once it is full", async () => {
  const cache = new TtlCache<string>(60_000, 2);
  await cache.load("a", async () => "a");
  await cache.load("b", async () => "b");
  await cache.load("c", async () => "c");

  assert.equal(cache.size, 2);
  // "a" was evicted, so it reloads; "c" is still resident.
  assert.equal(await cache.load("a", async () => "reloaded"), "reloaded");
  assert.equal(await cache.load("c", async () => "unused"), "c");
});

test("reading a key refreshes nothing — only writes reorder eviction", async () => {
  const cache = new TtlCache<string>(60_000, 2);
  await cache.load("a", async () => "a");
  await cache.load("b", async () => "b");
  await cache.load("a", async () => "unused");
  await cache.load("c", async () => "c");

  // "a" was only read, not rewritten, so it remains the oldest and is evicted.
  assert.equal(await cache.load("a", async () => "reloaded"), "reloaded");
});
