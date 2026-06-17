import { describe, it, expect } from "vitest";
import {
  ChartParser,
  createChartParser,
} from "../../src/multimodal/chart.js";
import { ChartType } from "../../src/multimodal/types.js";

describe("ChartParser", () => {
  let parser: ChartParser;

  beforeEach(() => {
    parser = createChartParser();
  });

  describe("type detection", () => {
    it("detects bar chart type", async () => {
      const type = await parser.detectChartType("bar chart showing sales");
      expect(type).toBe(ChartType.BAR);
    });

    it("detects line chart type", async () => {
      const type = await parser.detectChartType("line chart of trends");
      expect(type).toBe(ChartType.LINE);
    });

    it("detects pie chart type", async () => {
      const type = await parser.detectChartType("pie chart of market share");
      expect(type).toBe(ChartType.PIE);
    });

    it("detects scatter chart type", async () => {
      const type = await parser.detectChartType("scatter plot of correlation");
      expect(type).toBe(ChartType.SCATTER);
    });

    it("detects area chart type", async () => {
      const type = await parser.detectChartType("area chart of growth");
      expect(type).toBe(ChartType.AREA);
    });

    it("detects histogram type", async () => {
      const type = await parser.detectChartType("histogram of distribution");
      expect(type).toBe(ChartType.HISTOGRAM);
    });

    it("returns UNKNOWN for non-chart", async () => {
      const type = await parser.detectChartType("a beautiful landscape photo");
      expect(type).toBe(ChartType.UNKNOWN);
    });
  });

  describe("parseChart", () => {
    it("parses bar chart data", async () => {
      const data = await parser.parseChart(
        "bar chart showing sales, labels: [Jan, Feb, Mar], datasets: [{label: 'Revenue', values: [100, 200, 150]}]",
      );
      expect(data.type).toBe(ChartType.BAR);
      expect(data.labels).toEqual(["Jan", "Feb", "Mar"]);
      expect(data.datasets).toHaveLength(1);
      expect(data.datasets[0]!.values).toEqual([100, 200, 150]);
    });

    it("parses line chart data", async () => {
      const data = await parser.parseChart(
        "line chart of trends, labels: [Q1, Q2, Q3, Q4], datasets: [{label: 'Growth', values: [10, 20, 15, 30]}]",
      );
      expect(data.type).toBe(ChartType.LINE);
      expect(data.labels).toHaveLength(4);
    });

    it("parses pie chart data", async () => {
      const data = await parser.parseChart(
        "pie chart of market share, labels: [A, B, C, D, E], datasets: [{label: 'Share', values: [30, 25, 20, 15, 10]}]",
      );
      expect(data.type).toBe(ChartType.PIE);
      expect(data.datasets[0]!.values).toEqual([30, 25, 20, 15, 10]);
    });
  });

  describe("extraction", () => {
    it("extracts chart labels", async () => {
      const labels = await parser.extractLabels(
        "chart, labels: [Red, Blue, Green]",
      );
      expect(labels).toEqual(["Red", "Blue", "Green"]);
    });

    it("extracts chart datasets", async () => {
      const datasets = await parser.extractDatasets(
        "bar chart, datasets: [{label: 'A', values: [1, 2, 3]}]",
      );
      expect(datasets).toHaveLength(1);
      expect(datasets[0]!.label).toBe("A");
    });
  });

  describe("description", () => {
    it("generates chart description", () => {
      const chartData = {
        type: ChartType.BAR,
        title: "Sales Report",
        labels: ["Jan", "Feb"],
        datasets: [{ label: "Revenue", values: [100, 200] }],
        axes: { xLabel: "Month", yLabel: "USD" },
        rawDescription: "",
        extractionConfidence: 0.9,
      };
      const desc = parser.describeChart(chartData);
      expect(desc).toContain("Sales Report");
      expect(desc).toContain("bar");
      expect(desc).toContain("X-axis: Month");
      expect(desc).toContain("Y-axis: USD");
    });
  });

  describe("validation", () => {
    it("validates correct chart data", () => {
      const data = {
        type: ChartType.BAR,
        labels: ["A", "B"],
        datasets: [{ label: "S1", values: [1, 2] }],
        axes: {},
        rawDescription: "",
        extractionConfidence: 0.9,
      };
      const result = parser.validateChartData(data);
      expect(result.valid).toBe(true);
    });

    it("rejects chart with no datasets", () => {
      const data = {
        type: ChartType.BAR,
        labels: [],
        datasets: [],
        axes: {},
        rawDescription: "",
        extractionConfidence: 0.5,
      };
      const result = parser.validateChartData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("at least one dataset"))).toBe(true);
    });

    it("rejects pie with mismatched labels", () => {
      const data = {
        type: ChartType.PIE,
        labels: ["A", "B", "C"],
        datasets: [{ label: "S1", values: [1, 2] }],
        axes: {},
        rawDescription: "",
        extractionConfidence: 0.8,
      };
      const result = parser.validateChartData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Pie chart"))).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles empty chart data", async () => {
      const data = await parser.parseChart("some random text");
      expect(data.type).toBe(ChartType.UNKNOWN);
      expect(data.extractionConfidence).toBeLessThan(0.5);
    });
  });
});
