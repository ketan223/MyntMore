import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { classifyLead, type RawLead } from "../src/lib/lead";

const rows = parse(readFileSync("data/leads.csv", "utf8"), { columns: true, skip_empty_lines: true }) as RawLead[];
const prior = new Map<string, string>();
const result = rows.map(row => classifyLead(row, prior));
writeFileSync("data/preview-results.json", JSON.stringify(result, null, 2));
for (const item of result) console.log(`${item.lead_id.padEnd(3)} ${item.status.padEnd(7)} ${String(item.score).padStart(2)} ${String(item.service ?? "-").padEnd(18)} ${item.reason}`);
console.log(`Rows: ${result.length}; hot: ${result.filter(x => x.status === "hot").length}; warm: ${result.filter(x => x.status === "warm").length}; not fit: ${result.filter(x => x.status === "not_fit").length}`);
