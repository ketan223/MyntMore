import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parse } from "csv-parse/sync";
import { gradeHook } from "../src/lib/grade";
import { classifyLead, type RawLead } from "../src/lib/lead";

const rows = parse(readFileSync("data/leads.csv", "utf8"), { columns: true, skip_empty_lines: true }) as RawLead[];
test("every sample row has one auditable result", () => {
  const seen = new Map<string, string>();
  const results = rows.map(row => classifyLead(row, seen));
  assert.equal(results.length, 20);
  assert.equal(new Set(results.map(result => result.lead_id)).size, 20);
  assert.equal(results.find(x => x.lead_id === "L11")?.duplicate_of, "L03");
  for (const id of ["L05", "L07", "L09", "L14", "L16", "L18", "L19"]) assert.equal(results.find(x => x.lead_id === id)?.status, "not_fit");
  assert.equal(results.find(x => x.lead_id === "L15")?.duplicate_of, null);
});
test("hook scoring repeats exactly and stays in range", () => {
  const hook = "Most founders post more but hear less.\nHere is why buyer focus changes that.";
  assert.deepEqual(gradeHook(hook), gradeHook(hook));
  assert.equal(gradeHook(hook).checks.length, 5);
  assert.ok(gradeHook(hook).score >= 0 && gradeHook(hook).score <= 100);
});
