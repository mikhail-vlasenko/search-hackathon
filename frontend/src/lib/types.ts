export interface AnalysisResult {
  id: string;
  query: string;
  prompt: string;
  isMentioned: boolean; // whether the customer is mentioned in results
  mentionCount: number; // how many times mentioned
  favorabilityScore: number; // favorability score
  competitorAverage: number; // competitors average mentions
  percentageDifference: number; // percentage difference vs competitors
  totalSources: number; // total number of sources returned
  visibility: number;
  category: string;
  timestamp: Date;
}

export interface WebsiteAnalysis {
  url: string;
  totalQueries: number;
  averageRanking: number;
  overallVisibility: number;
  topCategory: string;
  results: AnalysisResult[];
}

export interface GeneratedPrompt {
  id: string;
  prompt: string;
  category: string;
  selected: boolean;
  queries: string[];
}

export type AnalysisStep = "input" | "prompts" | "analyzing" | "results";
