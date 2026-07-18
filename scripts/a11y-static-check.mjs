#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TARGET_DIRS = ["src/components", "src/app"];

const checks = [
  {
    id: "window-confirm",
    pattern: /window\.confirm\(/,
    message: "window.confirm を使用しています。ConfirmDialog に置き換えてください。",
    severity: "serious",
  },
  {
    id: "img-without-alt",
    pattern: /<img(?![^>]*\balt=)[^>]*>/,
    message: "alt 属性のない img があります。",
    severity: "critical",
  },
  {
    id: "dialog-without-name",
    pattern: /role="dialog"(?![\s\S]{0,400}(aria-labelledby|aria-label))/,
    message: "role=dialog に aria-labelledby または aria-label がありません。",
    severity: "serious",
  },
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    if (/\.(tsx|jsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

const findings = [];

for (const dirName of TARGET_DIRS) {
  const dirPath = path.join(ROOT, dirName);
  const files = await walk(dirPath);

  for (const filePath of files) {
    const content = await readFile(filePath, "utf8");

    for (const check of checks) {
      if (check.pattern.test(content)) {
        findings.push({
          file: path.relative(ROOT, filePath),
          ...check,
        });
      }
    }
  }
}

if (findings.length === 0) {
  console.log("a11y static check: critical/serious 0件");
  process.exit(0);
}

console.log(`a11y static check: ${findings.length} 件`);
for (const finding of findings) {
  console.log(`- [${finding.severity}] ${finding.file}: ${finding.message}`);
}

process.exit(1);
