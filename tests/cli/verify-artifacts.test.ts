/**
 * GA-A6 — verify artifact collection: vitest summary parsing + real quality scans.
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { parseVitestSummary, scanQuality } from "../../src/cli/commands/verify-artifacts.js";

describe("parseVitestSummary", () => {
  it("parses an all-passed summary", () => {
    const out = "\n Test Files  72 passed (72)\n      Tests  905 passed (905)\n   Duration  55.9s\n";
    expect(parseVitestSummary(out)).toEqual({ total: 905, passed: 905, failed: 0, skipped: 0 });
  });

  it("parses failed runs", () => {
    const out = "      Tests  1 failed | 28 passed (29)\n";
    expect(parseVitestSummary(out)).toEqual({ total: 29, passed: 28, failed: 1, skipped: 0 });
  });

  it("parses skipped runs", () => {
    const out = "      Tests  2 failed | 8 passed | 2 skipped (12)\n";
    expect(parseVitestSummary(out)).toEqual({ total: 12, passed: 8, failed: 2, skipped: 2 });
  });

  it("returns zeros when no summary is present", () => {
    expect(parseVitestSummary("random output\n")).toEqual({
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
    });
  });
});

describe("scanQuality", () => {
  function makeTree(files: Record<string, string>): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sciclaw-quality-"));
    for (const [rel, content] of Object.entries(files)) {
      const full = path.join(dir, rel);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, content);
    }
    return dir;
  }

  it("flags a clean tree as clean", () => {
    const dir = makeTree({
      "a.ts": "// Licensed under the Apache License, Version 2.0\nconst x = 1;\n",
      "nested/b.ts": "/* Apache-2.0 */\nexport const y = 2;\n",
    });
    expect(scanQuality(dir)).toEqual({
      hasChineseChars: false,
      hasHardcodedPaths: false,
      hasMissingApacheHeaders: false,
    });
  });

  it("flags Chinese characters, hardcoded paths and missing headers", () => {
    const dir = makeTree({
      "cn.ts": "// no header\nconst 标题 = '中文';\n",
      "paths.ts": "// Apache-2.0\nconst p = '/home/someone/project';\n",
    });
    expect(scanQuality(dir)).toEqual({
      hasChineseChars: true,
      hasHardcodedPaths: true,
      hasMissingApacheHeaders: true,
    });
  });
});
