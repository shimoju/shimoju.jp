import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/** @typedef {{ id: string, title: string, next_action: string, commit_message: string, scope: string[], acceptance_criteria: string[], verification_plan: string[], requirement_refs: string[], depends_on: string[], blocked_by: string[], review_ids: string[], verification_ids: string[], status: string, verification_status: string }} Task */
/** @typedef {{ id: string, task_ids: string[], verification_ids: string[], finding_ids: string[], supersedes: string | null, status: string, decision: { source: string, decided_by: string } | null }} Review */
/** @typedef {{ id: string, task_ids: string[], verification_ids: string[], status: string }} Finding */
/** @typedef {{ id: string, task_ids: string[], supersedes: string | null, subject_ref: string, environment: string, procedure: string, recorded_at: string }} Verification */
/** @type {{ tasks: Task[], findings: Finding[], reviews: Review[], verifications: Verification[], resume: {task_id: string | null}, latest_review_id: string | null }} */
const progress = JSON.parse(
  readFileSync(process.argv[2] ?? "../../docs/06-theme-implementation-progress.json", "utf8"),
);
/** @type {('tasks' | 'findings' | 'reviews' | 'verifications')[]} */
const groups = ["tasks", "findings", "reviews", "verifications"];
const ids = {
  tasks: new Map(progress.tasks.map((item) => [item.id, item])),
  findings: new Map(progress.findings.map((item) => [item.id, item])),
  reviews: new Map(progress.reviews.map((item) => [item.id, item])),
  verifications: new Map(progress.verifications.map((item) => [item.id, item])),
};
for (const group of groups)
  assert.equal(ids[group].size, progress[group].length, `Duplicate ${group} ID`);
/**
 * @template {keyof typeof ids} K
 * @param {K} group
 * @param {string} id
 * @returns {ReturnType<(typeof ids)[K]['get']> & {}}
 */
function reference(group, id) {
  assert.ok(ids[group].has(id), `Missing ${group} reference: ${id}`);
  return /** @type {ReturnType<(typeof ids)[K]['get']> & {}} */ (ids[group].get(id));
}
/** @template T
 * @param {T} item
 * @param {Partial<Record<keyof T, keyof typeof ids>>} fields
 */
function references(item, fields) {
  for (const field of /** @type {(keyof T)[]} */ (Object.keys(fields))) {
    const group = fields[field];
    assert.ok(group);
    const values = item[field];
    assert.ok(Array.isArray(values));
    for (const id of values) reference(group, id);
  }
}
for (const task of progress.tasks) {
  for (const field of /** @type {const} */ (["title", "next_action", "commit_message"]))
    assert.ok(task[field], `${task.id}: ${field}`);
  for (const field of /** @type {const} */ ([
    "scope",
    "acceptance_criteria",
    "verification_plan",
    "requirement_refs",
  ]))
    assert.ok(task[field].length, `${task.id}: ${field}`);
  assert.ok(task.commit_message.startsWith(`[${task.id}] `), task.id);
  assert.ok(
    ["not_started", "in_progress", "implemented", "complete"].includes(task.status),
    task.id,
  );
  assert.ok(
    ["not_run", "passed", "failed", "stale", "blocked"].includes(task.verification_status),
    task.id,
  );
  references(task, {
    depends_on: "tasks",
    blocked_by: "findings",
    review_ids: "reviews",
    verification_ids: "verifications",
  });
  if (task.status === "complete") {
    assert.equal(task.verification_status, "passed", task.id);
    assert.ok(task.verification_ids.length, `${task.id}: missing evidence`);
    assert.ok(
      task.review_ids.every((id) => reference("reviews", id).status === "approved"),
      task.id,
    );
    assert.ok(
      task.blocked_by.every((id) => reference("findings", id).status === "resolved"),
      task.id,
    );
  }
}
for (const review of progress.reviews) {
  references(review, {
    task_ids: "tasks",
    verification_ids: "verifications",
    finding_ids: "findings",
  });
  if (review.supersedes) reference("reviews", review.supersedes);
  if (review.status === "approved")
    assert.ok(
      review.decision?.source && review.decision?.decided_by,
      `${review.id}: missing explicit decision`,
    );
}
for (const finding of progress.findings)
  references(finding, { task_ids: "tasks", verification_ids: "verifications" });
for (const verification of progress.verifications) {
  references(verification, { task_ids: "tasks" });
  if (verification.supersedes) reference("verifications", verification.supersedes);
  assert.ok(
    verification.subject_ref &&
      verification.environment &&
      verification.procedure &&
      verification.recorded_at,
    verification.id,
  );
}
/** @param {string} id @param {Set<string>} visiting @returns {string[]} */
function ancestors(id, visiting = new Set()) {
  assert.ok(!visiting.has(id), `Dependency cycle: ${[...visiting, id].join(" -> ")}`);
  const next = new Set(visiting).add(id);
  return reference("tasks", id).depends_on.flatMap((parent) => [
    parent,
    ...ancestors(parent, next),
  ]);
}
for (const task of progress.tasks) ancestors(task.id);
/** @type {[string, number][]} */
const coverage = [
  ["04-theme-implementation-requirements", 34],
  ["05-theme-implementation-discipline", 9],
];
for (const [name, count] of coverage) {
  for (let q = 1; q <= count; q++) {
    const found = progress.tasks.some((task) =>
      task.requirement_refs.some(
        (ref) => ref.startsWith(`docs/${name}.md: `) && new RegExp(`\\bQ${q}\\b`).test(ref),
      ),
    );
    assert.ok(found, `${name}: Q${q} unassigned`);
  }
}
assert.ok(ancestors("T010").includes("T009"), "Full screens must depend on representative review");
assert.ok(reference("tasks", "T009").review_ids.length, "Representative review is required");
assert.ok(ancestors("T018").includes("T014"), "Completion must depend on full review");
for (const id of ["T015", "T016", "T017"])
  assert.ok(ancestors("T018").includes(id), `Completion must depend on ${id}`);
if (progress.resume.task_id) reference("tasks", progress.resume.task_id);
if (progress.latest_review_id) reference("reviews", progress.latest_review_id);
console.log(
  `Progress valid: ${progress.tasks.length} tasks; requirements Q1–Q34; discipline Q1–Q9; references and DAG checked. Human evidence still requires review.`,
);
