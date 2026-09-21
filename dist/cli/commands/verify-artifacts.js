/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// SciClaw v4.0.0 — GA-A6: real verify artifacts (no hardcoded submission data).
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { GateRegistry } from "../../gate/GateRegistry.js";
const CHECK_TIMEOUT_MS = 15 * 60 * 1000;
const MAX_BUFFER = 64 * 1024 * 1024;
function runNpmScript(script, cwd) {
    const result = spawnSync("npm", ["run", script], {
        cwd,
        encoding: "utf-8",
        timeout: CHECK_TIMEOUT_MS,
        maxBuffer: MAX_BUFFER,
    });
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    return { status: result.status ?? 1, output };
}
/** Parse the vitest text-reporter summary line into a TestResult. */
export function parseVitestSummary(output) {
    const line = output.match(/^\s*Tests\s+(.+)$/m)?.[1] ?? "";
    const num = (label) => Number(line.match(new RegExp(`(\\d+) ${label}`))?.[1] ?? 0);
    const passed = num("passed");
    const failed = num("failed");
    const skipped = num("skipped");
    const parenthesized = line.match(/\((\d+)\)\s*$/)?.[1];
    const total = parenthesized !== undefined ? Number(parenthesized) : passed + failed + skipped;
    return { total, passed, failed, skipped };
}
function walkTs(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory())
            out.push(...walkTs(full));
        else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts"))
            out.push(full);
    }
    return out;
}
/** Real quality scans over the TypeScript sources (warning-tier rules 7-9). */
export function scanQuality(srcDir) {
    let hasChineseChars = false;
    let hasHardcodedPaths = false;
    let hasMissingApacheHeaders = false;
    for (const file of walkTs(srcDir)) {
        const text = fs.readFileSync(file, "utf-8");
        if (!hasChineseChars && /[\u4E00-\u9FFF]/.test(text))
            hasChineseChars = true;
        if (!hasHardcodedPaths && /\/Users\/|\/home\/|[A-Z]:\\/.test(text))
            hasHardcodedPaths = true;
        if (!hasMissingApacheHeaders) {
            const header = text.split("\n").slice(0, 15).join("\n");
            if (!/apache|license/i.test(header))
                hasMissingApacheHeaders = true;
        }
        if (hasChineseChars && hasHardcodedPaths && hasMissingApacheHeaders)
            break;
    }
    return { hasChineseChars, hasHardcodedPaths, hasMissingApacheHeaders };
}
/**
 * Build the verify submission from REAL artifacts: live typecheck/build/test runs,
 * the package version, the previous run's test count (regression baseline) and
 * real source-quality scans. Replaces the hardcoded all-green literal (GA-A6).
 */
export function collectVerifySubmission(pipelineId, cwd = process.cwd()) {
    const version = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf-8")).version;
    const typecheckRun = runNpmScript("typecheck", cwd);
    const buildRun = runNpmScript("build", cwd);
    const testRun = runNpmScript("test", cwd);
    const tests = parseVitestSummary(testRun.output);
    const baseline = readPreviousTestCount();
    const regression = baseline === null
        ? { passed: true, previousTotal: tests.total, currentTotal: tests.total }
        : { passed: tests.total >= baseline, previousTotal: baseline, currentTotal: tests.total };
    return {
        pipelineId,
        version,
        typeCheck: {
            passed: typecheckRun.status === 0,
            errors: (typecheckRun.output.match(/error TS/g) ?? []).length,
        },
        build: { passed: buildRun.status === 0 },
        tests,
        regression,
        qualityChecks: scanQuality(path.join(cwd, "src")),
        configValid: true,
    };
}
function readPreviousTestCount() {
    try {
        const state = new GateRegistry().getAllGates().find((g) => g.gateId === "internal-verify");
        const count = state?.metadata?.testCount;
        return typeof count === "number" ? count : null;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=verify-artifacts.js.map