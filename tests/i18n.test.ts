import assert from "node:assert/strict";
import test from "node:test";

import {
  appShellLocale,
  defaultLocale,
  localeDefinitionFor,
  localeRoutingMode,
  negotiateLocale,
  normalizeLocale,
} from "../lib/i18n/config";
import {getDictionary} from "../lib/i18n/dictionaries";

test("normalizeLocale falls back supported region variants to the product locales", () => {
  assert.equal(normalizeLocale("fa"), "fa-IR");
  assert.equal(normalizeLocale("fa-AF"), "fa-IR");
  assert.equal(normalizeLocale("en-GB"), "en-US");
  assert.equal(normalizeLocale("zz-ZZ"), undefined);
});

test("negotiateLocale prefers profile, then cookie, then Accept-Language", () => {
  assert.equal(
    negotiateLocale({
      profileLocale: "en-US",
      cookieLocale: "fa-IR",
      acceptLanguage: "fa;q=1",
    }),
    "en-US"
  );
  assert.equal(
    negotiateLocale({
      cookieLocale: "en-US",
      acceptLanguage: "fa;q=1",
    }),
    "en-US"
  );
  assert.equal(
    negotiateLocale({
      acceptLanguage: "de-DE;q=1, fa-AF;q=0.8, en-US;q=0.7",
    }),
    "fa-IR"
  );
  assert.equal(negotiateLocale({acceptLanguage: "de-DE"}), defaultLocale);
});

test("locale definitions expose app boundary lang and direction", () => {
  assert.equal(appShellLocale, "fa-IR");
  assert.equal(localeDefinitionFor("fa-IR").dir, "rtl");
  assert.equal(localeDefinitionFor("fa-IR").htmlLang, "fa-IR");
  assert.equal(localeDefinitionFor("en-US").dir, "ltr");
  assert.equal(localeRoutingMode, "profile-cookie");
});

test("getDictionary returns localized PWA and metadata copy", async () => {
  const fa = await getDictionary("fa-IR");
  const en = await getDictionary("en-US");

  assert.match(fa.metadata.title, /دفتر تغذیه/);
  assert.match(fa.pwa.description, /PWA فارسی/);
  assert.match(en.metadata.title, /Nutrition log/);
  assert.match(en.pwa.installPrompt, /Install/);
});
