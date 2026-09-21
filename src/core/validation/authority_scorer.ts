import type { AuthorityScore } from "./types.js";

const KNOWN_INSTITUTIONS: Record<string, number> = {
  MIT: 0.95,
  "Massachusetts Institute of Technology": 0.95,
  "Stanford University": 0.95,
  "Harvard University": 0.95,
  "University of Oxford": 0.93,
  "University of Cambridge": 0.93,
  Caltech: 0.93,
  "California Institute of Technology": 0.93,
  "UC Berkeley": 0.9,
  "University of California, Berkeley": 0.9,
  "ETH Zurich": 0.9,
  "Imperial College London": 0.88,
  "Carnegie Mellon University": 0.88,
  CMU: 0.88,
  "Tsinghua University": 0.85,
  "Peking University": 0.85,
  "University of Tokyo": 0.85,
  "Google Research": 0.85,
  "Google DeepMind": 0.9,
  DeepMind: 0.9,
  OpenAI: 0.85,
  "Microsoft Research": 0.85,
  "Meta AI": 0.85,
  "Facebook AI Research": 0.85,
  FAIR: 0.85,
  "IBM Research": 0.8,
  "Bell Labs": 0.85,
  CERN: 0.9,
  NASA: 0.9,
  "Los Alamos National Laboratory": 0.88,
  "Max Planck Institute": 0.88,
  CNRS: 0.85,
  "Chinese Academy of Sciences": 0.85,
  "Russian Academy of Sciences": 0.8,
  "Indian Institute of Technology": 0.75,
  IIT: 0.75,
  "University of Toronto": 0.83,
  "National University of Singapore": 0.8,
  NUS: 0.8,
  "University of Melbourne": 0.78,
  "Seoul National University": 0.78,
  WHO: 0.9,
  "World Health Organization": 0.9,
  NIH: 0.9,
  "National Institutes of Health": 0.9,
  CDC: 0.88,
  "European Commission": 0.85,
  "United Nations": 0.85,
  IEEE: 0.85,
  ACM: 0.83,
  NIST: 0.9,
  FDA: 0.85,
  Amazon: 0.55,
  Apple: 0.55,
  Facebook: 0.5,
  Meta: 0.5,
  Twitter: 0.4,
};

const CREDENTIAL_BOOSTS: Record<string, number> = {
  "ph.d": 0.15,
  phd: 0.15,
  professor: 0.15,
  "research fellow": 0.12,
  "senior researcher": 0.12,
  distinguished: 0.1,
  fellow: 0.08,
  "m.d.": 0.1,
  md: 0.08,
  "pharm.d": 0.08,
  "sc.d": 0.15,
};

const WELL_KNOWN_AUTHORS = [
  "geoffrey hinton", "yann lecun", "yoshua bengio", "andrew ng",
  "fei-fei li", "ian goodfellow", "juergen schmidhuber",
  "demis hassabis", "ilya sutskever", "andrej karpathy",
  "sebastian thrun", "daphne koller", "michael jordan",
  "peter norvig", "stuart russell", "zico kolter",
  "percy liang", "christopher manning", "dan jurafsky",
  "richard sutton", "david silver", "pieter abbeel",
  "sergey levine", "chelsea finn", "anima anandkumar",
  "timnit gebru", "joy buolamwini", "kate crawford",
  "terence tao", "grigori perelman", "andrew wiles",
  "jennifer doudna", "emmanuelle charpentier",
];

const ACADEMIC_KEYWORDS = ["university", "institute", "college", "school", "academy"];
const RESEARCH_KEYWORDS = ["research", "laboratory", "lab", "center"];

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export class AuthorityScorer {
  private credentialWeight: number;
  private institutionWeight: number;
  private citationWeight: number;
  private recognitionWeight: number;

  constructor(weights?: { credential?: number; institution?: number; citation?: number; recognition?: number }) {
    this.credentialWeight = weights?.credential ?? 0.25;
    this.institutionWeight = weights?.institution ?? 0.3;
    this.citationWeight = weights?.citation ?? 0.25;
    this.recognitionWeight = weights?.recognition ?? 0.2;
    const total = this.credentialWeight + this.institutionWeight + this.citationWeight + this.recognitionWeight;
    if (Math.abs(total - 1.0) > 0.001) {
      throw new Error(`Weights must sum to 1.0, got ${total}`);
    }
  }

  scoreAuthority(author?: string, institution?: string, citationCount?: number): AuthorityScore {
    const credentialScore = this.scoreCredentials(author, "");
    const [instScore, isKnown] = this.scoreInstitution(institution);
    const citScore = this.scoreCitations(citationCount);
    const recogScore = this.scoreNameRecognition(author);

    const overall =
      credentialScore * this.credentialWeight +
      instScore * this.institutionWeight +
      citScore * this.citationWeight +
      recogScore * this.recognitionWeight;

    return {
      score: Math.round(clamp(overall) * 1000) / 1000,
      authorName: author,
      institution,
      citationCount: typeof citationCount === "number" && citationCount >= 0 ? citationCount : undefined,
      hasCredentials: credentialScore > 0.3,
    };
  }

  private scoreCredentials(_author: string | undefined, credentials: string): number {
    if (!credentials) return 0.3;
    const lower = credentials.toLowerCase();
    let score = 0.3;
    for (const [kw, boost] of Object.entries(CREDENTIAL_BOOSTS)) {
      if (lower.includes(kw)) {
        score += boost;
        break;
      }
    }
    return clamp(score);
  }

  private scoreInstitution(affiliation?: string): [number, boolean] {
    if (!affiliation) return [0.3, false];
    const lower = affiliation.toLowerCase();

    for (const [known, score] of Object.entries(KNOWN_INSTITUTIONS)) {
      if (known.toLowerCase() === lower || lower.includes(known.toLowerCase())) {
        return [score, true];
      }
    }

    if (ACADEMIC_KEYWORDS.some((kw) => lower.includes(kw))) return [0.65, false];
    if (RESEARCH_KEYWORDS.some((kw) => lower.includes(kw))) return [0.55, false];

    return [0.35, false];
  }

  private scoreCitations(count?: number): number {
    if (typeof count !== "number" || count <= 0) return 0.3;
    if (count >= 10000) return 1.0;
    if (count >= 1000) return 0.9;
    if (count >= 500) return 0.8;
    if (count >= 100) return 0.7;
    if (count >= 50) return 0.6;
    if (count >= 10) return 0.5;
    return 0.4;
  }

  private scoreNameRecognition(name?: string): number {
    if (!name) return 0.3;
    const lower = name.toLowerCase();
    if (WELL_KNOWN_AUTHORS.includes(lower)) return 1.0;

    const nameParts = lower.split(/\s+/);
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : undefined;

    if (lastName) {
      for (const known of WELL_KNOWN_AUTHORS) {
        const knownParts = known.split(/\s+/);
        if (knownParts.length >= 2 && knownParts[knownParts.length - 1] === lastName) {
          return 0.5;
        }
      }
    }

    return 0.3;
  }
}

export function scoreAuthority(author?: string, institution?: string, citationCount?: number): AuthorityScore {
  const scorer = new AuthorityScorer();
  return scorer.scoreAuthority(author, institution, citationCount);
}
