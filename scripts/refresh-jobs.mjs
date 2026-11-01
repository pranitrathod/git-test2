import { writeFile } from "node:fs/promises";

const HIMALAYAS_BASE = "https://himalayas.app/jobs/api";
const JOBICY_BASE = "https://jobicy.com/api/v2/remote-jobs";

async function getJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "JobPilot-Personal/1.0" },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

async function browseHimalayas(offset) {
  const url = new URL(HIMALAYAS_BASE);
  url.searchParams.set("limit", "20");
  url.searchParams.set("offset", String(offset));
  const payload = await getJson(url);
  if (!Array.isArray(payload.jobs)) throw new Error("Unexpected Himalayas response: jobs[] missing");
  return payload.jobs;
}

async function searchJobicy() {
  const url = new URL(JOBICY_BASE);
  url.searchParams.set("count", "100");
  url.searchParams.set("industry", "engineering");
  
  const payload = await getJson(url);
  if (!Array.isArray(payload.jobs)) throw new Error("Unexpected Jobicy response: jobs[] missing");
  return payload.jobs;
}

const queries = [
  { source: "Himalayas", run: () => browseHimalayas(0) },
  { source: "Himalayas", run: () => browseHimalayas(20) },
  { source: "Himalayas", run: () => browseHimalayas(40) },
  { source: "Jobicy", run: searchJobicy },
];

const settled = await Promise.allSettled(queries.map(query => query.run()));
const failures = [];
const rawJobs = [];
const successes = { Himalayas: 0, Jobicy: 0 };

for (let index = 0; index < settled.length; index++) {
  const result = settled[index];
  const source = queries[index].source;
  if (result.status === "fulfilled") {
    successes[source]++;
    rawJobs.push(...result.value.map(job => ({ ...job, __source: source })));
  } else {
    failures.push(`${source}: ${String(result.reason)}`);
  }
}

function normalizeHimalayas(job) {
  const expiry = job.expiryDate == null
    ? NaN
    : (typeof job.expiryDate === "number" ? job.expiryDate : Date.parse(job.expiryDate));
  if (Number.isFinite(expiry) && expiry < Date.now()) return null;

  const guid = job.guid ?? job.id ?? job.slug;
  const title = job.title ?? job.jobTitle ?? job.positionTitle;
  const applicationLink = job.applicationLink ?? job.applyUrl ?? job.url;
  if (guid == null || !title || !applicationLink) return null;

  const categories = Array.isArray(job.categories) ? job.categories : (Array.isArray(job.category) ? job.category : []);
  const parents = Array.isArray(job.parentCategories) ? job.parentCategories : [];
  const description = job.description || job.excerpt || "";
  const searchable = [title, job.excerpt, description, ...categories, ...parents].join(" ");
  if (!/\bjava\b|spring\s*boot|back.?end|software engineer|software developer|platform engineer|full.?stack|devops/i.test(searchable)) return null;

  return {
    guid: String(guid),
    source: "Himalayas",
    title,
    excerpt: job.excerpt || "",
    companyName: job.companyName || job.company_name || "Company not listed",
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
    categories: [...categories, ...parents],
    description,
    pubDate: job.pubDate ?? null,
    expiryDate: job.expiryDate ?? null,
    applicationLink,
  };
}

function normalizeJobicy(job) {
  const guid = job.id ?? job.guid;
  const title = job.jobTitle ?? job.title;
  const applicationLink = job.url ?? job.applicationLink;
  if (guid == null || !title || !applicationLink) return null;
  const jobText = [title, job.jobExcerpt, job.jobDescription, job.jobLevel, ...(Array.isArray(job.jobIndustry) ? job.jobIndustry : [])].join(" ");
  if (!/\\bjava\\b|spring\\s*boot|back.?end|software engineer|software developer|platform engineer|full.?stack|devops/i.test(jobText)) return null;

  return {
    guid: "jobicy-" + String(guid),
    source: "Jobicy",
    title,
    excerpt: job.jobExcerpt || "",
    companyName: job.companyName || "Company not listed",
    companySlug: "",
    employmentType: Array.isArray(job.jobType) ? job.jobType.join(", ") : (job.jobType || ""),
    minSalary: job.salaryMin ?? null,
    maxSalary: job.salaryMax ?? null,
    salaryPeriod: job.salaryPeriod || "yearly",
    currency: job.salaryCurrency || "",
    seniority: job.jobLevel ? [job.jobLevel] : [],
    locationRestrictions: job.jobGeo ? [{ name: job.jobGeo, alpha2: "" }] : [],
    timezoneRestrictions: [],
    categories: Array.isArray(job.jobIndustry) ? job.jobIndustry : [],
    description: job.jobDescription || job.jobExcerpt || "",
    pubDate: job.pubDate || null,
    expiryDate: null,
    applicationLink,
  };
}

const byGuid = new Map();
for (const job of rawJobs) {
  const normalized = job.__source === "Jobicy"
    ? normalizeJobicy(job)
    : normalizeHimalayas(job);
  if (!normalized) continue;
  const fingerprint = normalized.source + ":" + normalized.guid;
  byGuid.set(fingerprint, normalized);
}

const jobs = [...byGuid.values()].sort((a, b) => {
  const dateA = typeof a.pubDate === "number" ? a.pubDate : Date.parse(a.pubDate || 0);
  const dateB = typeof b.pubDate === "number" ? b.pubDate : Date.parse(b.pubDate || 0);
  return (Number.isFinite(dateB) ? dateB : 0) - (Number.isFinite(dateA) ? dateA : 0);
});

if (jobs.length === 0) {
  throw new Error(
    "No usable Java/backend jobs returned from the public sources. The previous published feed will remain in place. " +
    failures.join(" | ")
  );
}

const output = {
  generatedAt: new Date().toISOString(),
  sources: successes,
  failedQueries: failures,
  jobs,
};

await writeFile(new URL("../jobs-feed.json", import.meta.url), JSON.stringify(output, null, 2) + "\n");
const counts = jobs.reduce((result, job) => {
  result[job.source] = (result[job.source] || 0) + 1;
  return result;
}, {});
console.log(`Saved ${jobs.length} unique jobs: ${JSON.stringify(counts)}.`);
if (failures.length) console.warn("Partial query failures:", failures.join(" | "));
