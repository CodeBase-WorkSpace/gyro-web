import assert from "node:assert/strict";
import test from "node:test";

import {publicContactChannels} from "../lib/public-contact";

test("public social contact links use the official Gyro accounts", () => {
  assert.equal(
    publicContactChannels.instagram,
    "https://www.instagram.com/gyrohealth/",
  );
  assert.equal(publicContactChannels.telegram, "https://t.me/gyrohealth");
});
