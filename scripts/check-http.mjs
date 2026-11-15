import assert from "node:assert/strict";
const base = new URL(process.argv[2] ?? "http://localhost:3001");
assert.ok(["localhost", "127.0.0.1"].includes(base.hostname), "Use only the local preview server");
const assets = new Set(["/images/jezero.jpg", "/fonts/barlow-condensed-600.ttf", "/fonts/dm-sans-400.ttf", "/icon.svg"]);
for (const route of ["/", "/mars-maps", "/mind-space", "/mars-greenhouse"]) {
  const response = await fetch(new URL(route, base), { signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, `${route}: HTTP ${response.status}`);
  const html = await response.text();
  for (const tag of html.matchAll(/<(?:link|script)\b[^>]*>/g)) {
    const href = tag[0].match(/(?:href|src)="([^"]+)"/)?.[1];
    if (href?.startsWith("/_next/") || href?.startsWith("/icon.svg")) assets.add(href.replaceAll("&amp;", "&"));
  }
  console.log(`${route}: HTTP 200`);
}
for (const asset of assets) {
  const response = await fetch(new URL(asset, base), { signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200, `${asset}: HTTP ${response.status}`);
  await response.arrayBuffer();
}
const missing = await fetch(new URL("/missing-mission-page", base));
assert.equal(missing.status, 404);
console.log(`${assets.size} linked/local assets: HTTP 200; missing route: HTTP 404`);
console.log("HTTP checks do not execute browser JavaScript or prove visual layout/console behavior.");
