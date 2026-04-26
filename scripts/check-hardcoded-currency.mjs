import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = new URL("../src/", import.meta.url);
const ALLOWED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const HARD_CODED_PATTERN = /₹|\bINR\b/g;

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    if (ALLOWED_EXTENSIONS.has(extname(fullPath))) {
      files.push(fullPath);
    }
  }
  return files;
}

const srcPath = ROOT.pathname;
const filePaths = walk(srcPath);
const violations = [];

for (const filePath of filePaths) {
  const content = readFileSync(filePath, "utf8");
  const matches = content.match(HARD_CODED_PATTERN);
  if (matches?.length) {
    violations.push(`${filePath}: ${matches.length} match(es)`);
  }
}

if (violations.length > 0) {
  console.error("Hardcoded currency literals detected:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("No hardcoded INR/₹ currency literals found.");
