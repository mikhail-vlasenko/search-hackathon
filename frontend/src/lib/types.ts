export interface WebSearchResult {
  [searchQuery: string]: {
    [url: string]: number[]; // citation rankings
  };
}

export interface ModelResponse {
  model: string;
  response: string;
  web_searches: WebSearchResult;
  success: boolean;
  run_number: number;
}

export interface APIResponse {
  prompt: string;
  results: {
    [modelName: string]: ModelResponse[];
  };
  summary: {
    [modelName: string]: {
      total_runs: number;
      successful_runs: number;
      success_rate: number;
      total_web_searches: number;
      unique_web_searches: number;
      web_search_queries: string[];
    };
  };
}

export type APIResponseList = APIResponse[];

export interface AnalysisResult {
  id: string;
  query: string;
  prompt: string;
  isMentioned: boolean; // whether the customer domain appears in any results
  averageRanking: number; // average citation ranking for customer domain
  totalSearches: number; // total number of web searches performed
  appearsInSearches: number; // number of searches where domain appears
  // mentionCount: number; // how many times mentioned
  // favorabilityScore: number; // favorability score
  // competitorAverage: number; // competitors average mentions
  // percentageDifference: number; // percentage difference vs competitors
  totalSources: number; // total number of sources returned
  visibility: number;
  promptCount: number; // how many prompts this query appears in
  category: string;
  timestamp: Date;
  // Citation distribution data for sparkline
  citationDistribution?: Array<{
    position: number;
    count: number;
  }>;
  userDomainPositions?: number[]; // positions where user domain appears
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
