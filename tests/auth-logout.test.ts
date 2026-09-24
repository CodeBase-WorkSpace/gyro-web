import assert from "node:assert/strict";
import test from "node:test";

import { LOGOUT_REDIRECT_PATH } from "../lib/auth/logout";

test("logout route redirects back to the auth entrypoint", () => {
  assert.equal(LOGOUT_REDIRECT_PATH, "/auth");
});
