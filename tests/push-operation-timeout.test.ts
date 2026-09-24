import assert from "node:assert/strict";
import test from "node:test";

import {withTimeout} from "../lib/pwa/promise-timeout";

test("Push browser operations return normally before the deadline", async () => {
  assert.equal(await withTimeout(Promise.resolve("ready"), 50), "ready");
});

test("Push browser operations reject instead of loading forever", async () => {
  await assert.rejects(
    withTimeout(new Promise<never>(() => undefined), 5),
    /بیش از حد طول کشید/,
  );
});
