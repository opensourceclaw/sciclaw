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
import type { Alert, AlertRule, ResearchMetrics } from "./types.js";
/**
 * Default alert rules for research pipeline.
 */
export declare const DEFAULT_ALERT_RULES: AlertRule[];
/**
 * Alert manager for evaluating rules and managing alerts.
 */
export declare class AlertManager {
    private rules;
    private alerts;
    private alertCounter;
    constructor(rules?: AlertRule[]);
    /**
     * Add alert rule.
     */
    addRule(rule: AlertRule): void;
    /**
     * Remove alert rule.
     */
    removeRule(name: string): void;
    /**
     * Get all rules.
     */
    getRules(): AlertRule[];
    /**
     * Evaluate rules against metrics.
     */
    evaluate(metrics: ResearchMetrics): Alert[];
    /**
     * Get active (firing) alerts.
     */
    getActiveAlerts(): Alert[];
    /**
     * Get all alerts.
     */
    getAllAlerts(): Alert[];
    /**
     * Get alert by ID.
     */
    getAlert(alertId: string): Alert | undefined;
    /**
     * Resolve alert.
     */
    resolve(alertId: string): void;
    /**
     * Clear all alerts.
     */
    clearAll(): void;
    private evaluateCondition;
    private createAlert;
}
//# sourceMappingURL=AlertManager.d.ts.map