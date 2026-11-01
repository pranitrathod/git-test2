import { readFile, writeFile } from "node:fs/promises";

const BASE = "https://himalayas.app/jobs/api/search";
const searches = [
  { q: "Java", country: "IN" },
  { q: "Spring Boot", country: "IN" },
  { q: "Backend", country: "IN" },
  { q: "Java", worldwide: "true" },
  { q: "Backend", worldwide: "true" },
];

async function fetchJobs(params) {
  const url = new URL(BASE);
  for (const [key, value] of Object.entries({ ...params, sort: "recent", page: "1" })) {
    url.searchParams.set(key, value);
  }
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "JobPilot-Personal/1.0" },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`${url.searchParams.toString()}: HTTP ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload.jobs)) throw new Error("Unexpected Himalayas API response shape");
  return payload.jobs;
}

const settled = await Promise.allSettled(searches.map(fetchJobs));
const successful = settled.filter(result => result.status === "fulfilled");
const failures = settled.filter(result => result.status === "rejected").map(result => String(result.reason));
if (successful.length === 0) {
  throw new Error("All Himalayas job queries failed; keeping the previous cache. " + failures.join(" | "));
}

const byGuid = new Map();
for (const result of successful) {
  for (const job of result.value) {
    if (!job?.guid || !job?.title || !job?.applicationLink) continue;
    if (job.expiryDate && Number(job.expiryDate) < Date.now()) continue;
    byGuid.set(String(job.guid), {
      guid: String(job.guid),
      title: job.title,
      excerpt: job.excerpt || "",
      companyName: job.companyName || "Company not listed",
      companySlug: job.companySlug || "",
      employmentType: job.employmentType || "",
      minSalary: job.minSalary ?? null,
      maxSalary: job.maxSalary ?? null,
      salaryPeriod: job.salaryPeriod || "annual",
      currency: job.currency || "",
      seniority: Array.isArray(job.seniority) ? job.seniority : [],
      locationRestrictions: Array.isArray(job.locationRestrictions)
        ? job.locationRestrictions.map(location => ({ name: location.name || "", alpha2: location.alpha2 || "" }))
        : [],
      timezoneRestrictions: Array.isArray(job.timezoneRestrictions) ? job.timezoneRestrictions : [],
      categories: Array.isArray(job.categories) ? job.categories : [],
      description: job.description || job.excerpt || "",
      pubDate: job.pubDate ?? null,
      expiryDate: job.expiryDate ?? null,
      applicationLink: job.applicationLink,
    });
  }
}

const jobs = [...byGuid.values()].sort((a, b) => {
  const dateA = typeof a.pubDate === "number" ? a.pubDate : Date.parse(a.pubDate || 0);
  const dateB = typeof b.pubDate === "number" ? b.pubDate : Date.parse(b.pubDate || 0);
  return dateB - dateA;
});

const output = {
  generatedAt: new Date().toISOString(),
  source: "Himalayas",
  queryCount: successful.length,
  failedQueries: failures,
  jobs,
};

await writeFile(new URL("../jobs-feed.json", import.meta.url), JSON.stringify(output, null, 2) + "\n");
console.log(`Saved ${jobs.length} unique Himalayas jobs from ${successful.length}/${searches.length} queries.`);
if (failures.length) console.warn("Partial query failures:", failures.join(" | "));
