import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const localeDir = path.join(root, "client", "src", "locales");
const sourceDirs = [path.join(root, "client", "src")];
const localeNames = ["en", "bn", "hi"];

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(localeDir, `${name}.json`), "utf8"));
}

function flatten(value, prefix = "") {
  return Object.entries(value).reduce((result, [key, child]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      for (const nestedKey of flatten(child, fullKey)) result.add(nestedKey);
    } else {
      result.add(fullKey);
    }
    return result;
  }, new Set());
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(file);
    return /\.(tsx?|jsx?)$/.test(entry.name) && !entry.name.endsWith(".test.ts") && !entry.name.endsWith(".test.tsx") ? [file] : [];
  });
}

const locales = Object.fromEntries(localeNames.map((name) => [name, readJson(name)]));
const localeKeys = Object.fromEntries(localeNames.map((name) => [name, flatten(locales[name])]));
const source = sourceDirs.flatMap(walk).map((file) => fs.readFileSync(file, "utf8")).join("\n");
const usedKeys = new Set();
for (const match of source.matchAll(/\bt\(\s*["'`]([^"'`]+)["'`]/g)) usedKeys.add(match[1]);

const missingByLocale = {};
for (const name of localeNames.slice(1)) {
  missingByLocale[name] = [...localeKeys.en].filter((key) => !localeKeys[name].has(key));
}
const unusedEnglishKeys = [...localeKeys.en].filter((key) => ![...usedKeys].some((used) => used === key || used.startsWith(`${key}.`)));
const missingSourceKeys = [...usedKeys].filter((key) => !key.includes("${") && !localeKeys.en.has(key));

let failed = false;
for (const name of localeNames.slice(1)) {
  if (missingByLocale[name].length) {
    failed = true;
    console.error(`${name} is missing: ${missingByLocale[name].join(", ")}`);
  }
}
if (missingSourceKeys.length) {
  failed = true;
  console.error(`Source keys missing from en: ${missingSourceKeys.join(", ")}`);
}
console.log(`i18n audit: ${localeKeys.en.size} English keys, ${usedKeys.size} source keys, ${unusedEnglishKeys.length} unused English keys`);
if (unusedEnglishKeys.length) console.log(`Unused English keys: ${unusedEnglishKeys.join(", ")}`);
if (failed) process.exit(1);
