import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const localeDir = path.join(root, "client/src/locales");
const localeNames = ["en", "bn", "hi"];

function flatten(value, prefix = "", output = new Set()) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return output;
  for (const [key, child] of Object.entries(value)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) flatten(child, next, output);
    else output.add(next);
  }
  return output;
}

const localeKeys = new Map(localeNames.map((name) => [name, flatten(JSON.parse(fs.readFileSync(path.join(localeDir, `${name}.json`), "utf8")))]));
const english = localeKeys.get("en");
const errors = [];
for (const name of localeNames) {
  const keys = localeKeys.get(name);
  for (const key of english) if (!keys.has(key)) errors.push(`${name}.json missing ${key}`);
  for (const key of keys) if (!english.has(key)) errors.push(`${name}.json has extra ${key}`);
}

function visit(directory) {
  const results = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith("_")) results.push(...visit(full));
    else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) results.push(full);
  }
  return results;
}
const source = visit(path.join(root, "client/src"));
const used = new Set();
for (const file of source) {
  const text = fs.readFileSync(file, "utf8");
  for (const match of text.matchAll(/\bt\(\s*["']([^"']+)["']\s*[,)]/g)) used.add(match[1]);
}
for (const key of used) if (!english.has(key) && !key.includes(".")) errors.push(`source key absent from en.json: ${key}`);
if (errors.length) {
  console.error(`i18n check failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`i18n check passed: ${english.size} keys are present in en.json, bn.json, and hi.json.`);
