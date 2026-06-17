import { describe, it, expect } from "vitest";
import {
  TableExtractor,
  createTableExtractor,
} from "../../src/multimodal/table.js";
import { TableFormat } from "../../src/multimodal/types.js";

const htmlTable = `<table>
  <tr><th>Name</th><th>Age</th><th>City</th></tr>
  <tr><td>Alice</td><td>30</td><td>NYC</td></tr>
  <tr><td>Bob</td><td>25</td><td>SF</td></tr>
</table>`;

const htmlWithCaption = `<table>
  <caption>Employee List</caption>
  <tr><th>Name</th><th>Age</th></tr>
  <tr><td>Alice</td><td>30</td></tr>
</table>`;

const markdownTable = `| Name | Age | City |
| --- | --- | --- |
| Alice | 30 | NYC |
| Bob | 25 | SF |`;

const markdownAligned = `| Name | Age | City |
| :--- | ---: | :---: |
| Alice | 30 | NYC |`;

const csvTable = `Name,Age,City
Alice,30,NYC
Bob,25,SF`;

const csvQuoted = `Name,Description
Alice,"Likes cats, dogs, and birds"
Bob,"Engineer, musician"`;

const jsonTable = `[
  {"Name": "Alice", "Age": "30", "City": "NYC"},
  {"Name": "Bob", "Age": "25", "City": "SF"}
]`;

describe("TableExtractor", () => {
  let extractor: TableExtractor;

  beforeEach(() => {
    extractor = createTableExtractor();
  });

  describe("HTML extraction", () => {
    it("extracts HTML table", () => {
      const table = extractor.extractTable(htmlTable);
      expect(table.headers).toEqual(["Name", "Age", "City"]);
      expect(table.rows).toHaveLength(2);
      expect(table.sourceFormat).toBe(TableFormat.HTML);
    });

    it("extracts HTML table with caption", () => {
      const table = extractor.extractTable(htmlWithCaption);
      expect(table.caption).toBe("Employee List");
    });

    it("extracts HTML table with multiple rows", () => {
      const table = extractor.extractTable(htmlTable);
      expect(table.rowCount).toBe(2);
      expect(table.rows[0]).toEqual(["Alice", "30", "NYC"]);
    });
  });

  describe("Markdown extraction", () => {
    it("extracts Markdown table", () => {
      const table = extractor.extractTable(markdownTable);
      expect(table.headers).toHaveLength(3);
      expect(table.rows).toHaveLength(2);
      expect(table.sourceFormat).toBe(TableFormat.MARKDOWN);
    });

    it("extracts Markdown table with alignment", () => {
      const table = extractor.extractTable(markdownAligned);
      expect(table.headers).toHaveLength(3);
      expect(table.rows).toHaveLength(1);
    });
  });

  describe("CSV extraction", () => {
    it("extracts CSV table", () => {
      const table = extractor.extractTable(csvTable);
      expect(table.headers).toEqual(["Name", "Age", "City"]);
      expect(table.rows).toHaveLength(2);
      expect(table.sourceFormat).toBe(TableFormat.CSV);
    });

    it("extracts CSV with quoted values", () => {
      const table = extractor.extractTable(csvQuoted);
      expect(table.headers).toEqual(["Name", "Description"]);
      expect(table.rows).toHaveLength(2);
    });
  });

  describe("JSON extraction", () => {
    it("extracts JSON table", () => {
      const table = extractor.extractTable(jsonTable);
      expect(table.headers).toHaveLength(3);
      expect(table.rows).toHaveLength(2);
      expect(table.sourceFormat).toBe(TableFormat.JSON);
    });
  });

  describe("detection", () => {
    it("detects numeric data", () => {
      const table = extractor.extractTable(htmlTable);
      expect(extractor.hasNumericData(table)).toBe(true);
    });

    it("detects non-numeric data", () => {
      const table = extractor.extractTable(`Name,City\nAlice,NYC\nBob,SF`);
      expect(extractor.hasNumericData(table)).toBe(false);
    });
  });

  describe("conversion", () => {
    it("converts to Markdown", () => {
      const table = extractor.extractTable(csvTable);
      const md = extractor.toMarkdown(table);
      expect(md).toContain("| Name | Age | City |");
      expect(md).toContain("| Alice | 30 | NYC |");
    });

    it("converts to CSV", () => {
      const table = extractor.extractTable(htmlTable);
      const csv = extractor.toCSV(table);
      expect(csv).toContain("Name,Age,City");
      expect(csv).toContain("Alice,30,NYC");
    });

    it("converts to JSON", () => {
      const table = extractor.extractTable(csvTable);
      const json = extractor.toJSON(table);
      expect(json).toHaveLength(2);
      expect(json[0]!.Name).toBe("Alice");
    });
  });

  describe("format detection", () => {
    it("detects HTML format", () => {
      expect(extractor.detectFormat(htmlTable)).toBe(TableFormat.HTML);
    });

    it("detects Markdown format", () => {
      expect(extractor.detectFormat(markdownTable)).toBe(TableFormat.MARKDOWN);
    });

    it("detects CSV format", () => {
      expect(extractor.detectFormat(csvTable)).toBe(TableFormat.CSV);
    });
  });

  describe("edge cases", () => {
    it("handles empty input", () => {
      const table = extractor.extractTable("");
      expect(table.rows).toHaveLength(0);
    });

    it("handles table exceeding maxRows", () => {
      const small = createTableExtractor({ maxRows: 1 });
      const table = small.extractTable(htmlTable);
      expect(table.rows.length).toBeLessThanOrEqual(1);
    });

    it("handles malformed HTML", () => {
      const table = extractor.extractTable("<table><tr><td>Broken</table>");
      expect(table.headers).toBeDefined();
    });

    it("handles nested tables", () => {
      const nested = `<table><tr><th>A</th></tr><tr><td>1</td></tr></table>
      <table><tr><th>B</th></tr><tr><td>2</td></tr></table>`;
      const tables = extractor.extractTables(nested);
      expect(tables).toHaveLength(2);
    });
  });
});
