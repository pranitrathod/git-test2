import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const manifest = JSON.parse(readFileSync(new URL("../app.webmanifest", import.meta.url), "utf8"));
const worker = readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");

assert.match(html, /<title>JobPilot/);
assert.match(html, /rel="manifest" href="\.\/app\.webmanifest"/);
assert.match(html, /serviceWorker\.register\('\.\/service-worker\.js'\)/);
assert.match(html, /https:\/\/remotive\.com\/api\/remote-jobs/);
assert.match(html, /https:\/\/www\.arbeitnow\.com\/api\/job-board-api/);
assert.match(html, /credentials:'omit'/);
assert.match(html, /referrerPolicy:'no-referrer'/);
assert.match(html, /localStorage\.setItem\(KEY/);
assert.match(html, /data-action=\\?"next-jobs\\?"/);
assert.match(html, /data-action=\\?"edit-app\\?"/);
assert.match(html, /Remotive/);
assert.match(html, /Arbeitnow/);
assert.doesNotMatch(html, /Pranit Rathod|Jio Platforms Limited|Persistent Systems|pranit\.rathod@[\w.-]+/i);

const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1])
  .filter(script => script.trim().length > 0);
assert.equal(inlineScripts.length, 1, "Expected one application script block");
new Function(inlineScripts[0]);

assert.equal(manifest.name.startsWith("JobPilot"), true);
assert.equal(manifest.display, "standalone");
assert.equal(manifest.start_url, "./");
assert.match(worker, /addEventListener\("fetch"/);
new Function(worker);

console.log("JobPilot smoke tests passed.");
