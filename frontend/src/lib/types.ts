export interface AnalysisResult {
  id: string;
  query: string;
  prompt: string;
  ranking: number;
  visibility: number;
  clickPotential: number;
  searchVolume: number;
  difficulty: number;
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
}

export type AnalysisStep = "input" | "prompts" | "analyzing" | "results";
