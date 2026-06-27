/**
 * DeepClaw v3.0.0-rc.3 — NLP index smoke test
 */
import { describe, it, expect } from "vitest";
import * as nlp from "../../src/nlp/index.js";
import { extractEntities, extractEntitiesWithCustom } from "../../src/nlp/ner.js";
import { extractRelations, extractRelationsBetweenEntities, extractEntitiesAndRelations } from "../../src/nlp/rel-extract.js";

describe("NLP Index", () => {
  it("exports extractEntities", () => {
    expect(nlp.extractEntities).toBe(extractEntities);
    expect(typeof nlp.extractEntities).toBe("function");
  });

  it("exports extractEntitiesWithCustom", () => {
    expect(nlp.extractEntitiesWithCustom).toBe(extractEntitiesWithCustom);
    expect(typeof nlp.extractEntitiesWithCustom).toBe("function");
  });

  it("exports extractRelations", () => {
    expect(nlp.extractRelations).toBe(extractRelations);
    expect(typeof nlp.extractRelations).toBe("function");
  });

  it("exports extractRelationsBetweenEntities", () => {
    expect(nlp.extractRelationsBetweenEntities).toBe(extractRelationsBetweenEntities);
    expect(typeof nlp.extractRelationsBetweenEntities).toBe("function");
  });

  it("exports extractEntitiesAndRelations", () => {
    expect(nlp.extractEntitiesAndRelations).toBe(extractEntitiesAndRelations);
    expect(typeof nlp.extractEntitiesAndRelations).toBe("function");
  });
});
