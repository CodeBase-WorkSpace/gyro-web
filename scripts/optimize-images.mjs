#!/usr/bin/env node
// Normalizes source artwork under public/images/ to WebP at a sane resolution.
//
//   node scripts/optimize-images.mjs            # report what would change
//   node scripts/optimize-images.mjs --write    # convert, then delete the source
//
// Why WebP for these and not for everything in public/:
//
// Anything rendered through next/image is ALREADY delivered as WebP — Next
// re-encodes and resizes on demand, so converting the source changes nothing
// the user downloads. What it changes is the repo, the Docker image we build
// locally and push to GHCR, and how much work the optimizer does the first time
// each variant is requested. That is why this script only walks public/images/.
//
// public/icons/ and public/apple-touch-icon.png are deliberately excluded: they
// are served raw from the manifest and <link rel="icon">, and iOS only accepts
// PNG for apple-touch-icon. Those are produced by frontend/scripts/create-pwa-icons.sh.

import {readdirSync, statSync, unlinkSync} from "node:fs";
import {extname, join} from "node:path";
import sharp from "sharp";

const ROOT = "public/images";
const MAX_EDGE = 1024;
const QUALITY = 82;
const CONVERTIBLE = new Set([".png", ".jpg", ".jpeg"]);
const KB = 1024;

const write = process.argv.includes("--write");

function walk(dir) {
  return readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    return CONVERTIBLE.has(extname(entry.name).toLowerCase()) ? [path] : [];
  });
}

const sources = walk(ROOT);
if (!sources.length) {
  console.log(`No convertible images under ${ROOT}/. Nothing to do.`);
  process.exit(0);
}

let before = 0;
let after = 0;

for (const source of sources) {
  const target = source.replace(/\.(png|jpe?g)$/i, ".webp");
  const sourceBytes = statSync(source).size;
  const image = sharp(source);
  const {width, height} = await image.metadata();
  const needsResize = Math.max(width ?? 0, height ?? 0) > MAX_EDGE;

  const buffer = await image
    .resize({
      width: needsResize ? MAX_EDGE : undefined,
      height: needsResize ? MAX_EDGE : undefined,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({quality: QUALITY})
    .toBuffer();

  before += sourceBytes;
  after += buffer.length;

  console.log(
    `${source}\n  ${(sourceBytes / KB).toFixed(0)} KB ${width}x${height}` +
    ` -> ${(buffer.length / KB).toFixed(0)} KB webp` +
    `${needsResize ? ` (capped at ${MAX_EDGE}px)` : ""}`,
  );

  if (write) {
    await sharp(buffer).toFile(target);
    unlinkSync(source);
    console.log(`  wrote ${target}, removed source`);
  }
}

const saved = before - after;
console.log(
  `\n${sources.length} image(s): ${(before / KB).toFixed(0)} KB -> ` +
  `${(after / KB).toFixed(0)} KB (saves ${(saved / KB).toFixed(0)} KB, ` +
  `${((saved / before) * 100).toFixed(0)}%)`,
);
if (!write) console.log("Dry run. Re-run with --write to apply.");
