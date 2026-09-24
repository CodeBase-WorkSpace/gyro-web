#!/usr/bin/env node
// Reports the JS a prerendered route actually loads, raw and gzipped, by reading
// the <script src> tags Next wrote into .next/server/app/*.html. Turbopack builds
// do not print a size table and @next/bundle-analyzer does not support them, so
// this is the measurement of record for the cold-start work.
//
//   node scripts/measure-bundle.mjs                 # print current sizes
//   node scripts/measure-bundle.mjs --save          # write the baseline
//   node scripts/measure-bundle.mjs --diff          # compare against the baseline
//
// Only statically prerendered routes appear here. `/_not-found` is the useful
// one: it has no page code, so its total is the shared baseline every route pays.
//
// Scope, so the numbers are not over-read: this counts the JS referenced from
// route HTML <script src> tags — the payload that must be fetched, parsed and
// compiled before hydration. It is the right metric for cold start, and it is
// the only thing it measures. It does NOT include chunks pulled in moments
// later by next/dynamic (sonner, the offline banner, recharts, the quick-add
// sheet), so a route's total JS over its first few seconds is higher than what
// prints here. For that number, take a browser trace.

import {gzipSync} from "node:zlib";
import {readFileSync, writeFileSync, existsSync, readdirSync, statSync} from "node:fs";
import {join, relative} from "node:path";

const APP_DIR = ".next/server/app";
const BASELINE = "scripts/.bundle-baseline.json";
const KB = 1024;

function htmlFiles(dir) {
  return readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith(".html") ? [path] : [];
  });
}

function measure(htmlPath) {
  const html = readFileSync(htmlPath, "utf8");
  const sources = new Set(
    [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+)"/g)].map((m) => m[1]),
  );

  let raw = 0;
  let gz = 0;
  for (const source of sources) {
    const file = join(".next", source.slice("/_next".length));
    if (!existsSync(file)) continue;
    const bytes = readFileSync(file);
    raw += bytes.length;
    gz += gzipSync(bytes, {level: 6}).length;
  }

  return {
    route: "/" + relative(APP_DIR, htmlPath).replace(/\.html$/, "").replace(/^index$/, ""),
    chunks: sources.size,
    raw,
    gz,
    html: statSync(htmlPath).size,
  };
}

if (!existsSync(APP_DIR)) {
  console.error(`No build found at ${APP_DIR}. Run \`pnpm build\` first.`);
  process.exit(1);
}

const rows = htmlFiles(APP_DIR).map(measure).sort((a, b) => b.gz - a.gz);
const mode = process.argv[2];

if (mode === "--save") {
  writeFileSync(BASELINE, JSON.stringify(Object.fromEntries(rows.map((r) => [r.route, r])), null, 2));
  console.log(`Baseline saved to ${BASELINE} (${rows.length} routes).`);
  process.exit(0);
}

const baseline = mode === "--diff" && existsSync(BASELINE)
  ? JSON.parse(readFileSync(BASELINE, "utf8"))
  : null;

if (mode === "--diff" && !baseline) {
  console.error(`No baseline at ${BASELINE}. Run with --save first.`);
  process.exit(1);
}

const pad = (text, width) => String(text).padEnd(width);
const num = (value, width) => String(value).padStart(width);

console.log(pad("route", 42) + num("chunks", 7) + num("raw KB", 10) + num("gz KB", 9) + (baseline ? num("Δ gz KB", 10) : ""));
console.log("-".repeat(baseline ? 78 : 68));

for (const row of rows) {
  const before = baseline?.[row.route];
  const delta = before ? (row.gz - before.gz) / KB : null;
  const deltaText = delta === null
    ? ""
    : num(delta === 0 ? "0" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}`, 10);

  console.log(
    pad(row.route, 42) +
    num(row.chunks, 7) +
    num((row.raw / KB).toFixed(1), 10) +
    num((row.gz / KB).toFixed(1), 9) +
    deltaText,
  );
}

const shared = rows.find((row) => row.route === "/_not-found");
if (shared) {
  const before = baseline?.["/_not-found"];
  const suffix = before
    ? ` (was ${(before.raw / KB).toFixed(1)} KB raw / ${(before.gz / KB).toFixed(1)} KB gz)`
    : "";
  console.log(
    `\nShared baseline every route pays: ${(shared.raw / KB).toFixed(1)} KB raw / ` +
    `${(shared.gz / KB).toFixed(1)} KB gz${suffix}`,
  );
  console.log(
    "Initial <script src> payload only — excludes chunks next/dynamic fetches after hydration.",
  );
}
