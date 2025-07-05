"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AnalysisStep,
  GeneratedPrompt,
  WebsiteAnalysis,
  APIResponseList,
  AnalysisResult,
} from "@/lib/types";
import PromptsStep from "@/components/analytics/PromptsStep";
import AnalyzingStep from "@/components/analytics/AnalyzingStep";
import ResultsStep from "@/components/analytics/ResultsStep";

// Function to extract domain from URL
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

// Function to process API response and create analysis results
function processAPIResponse(
  apiResponses: APIResponseList,
  websiteUrl: string,
  prompts: GeneratedPrompt[]
): AnalysisResult[] {
  const customerDomain = extractDomain(websiteUrl);
  const results: AnalysisResult[] = [];

  apiResponses.forEach((apiResponse) => {
    // Find the corresponding prompt
    const prompt = prompts.find((p) => p.prompt === apiResponse.prompt);
    if (!prompt) return;

    // Process each model's response (for now, just use the first successful one)
    const modelNames = Object.keys(apiResponse.results);
    const primaryModel = modelNames[0];
    const modelResponses = apiResponse.results[primaryModel];

    if (!modelResponses || modelResponses.length === 0) return;

    const primaryResponse = modelResponses[0];
    if (!primaryResponse.success) return;

    // Analyze web searches for customer domain
    const webSearches = primaryResponse.web_searches;
    const searchQueries = Object.keys(webSearches);

    let totalSearches = searchQueries.length;
    let appearsInSearches = 0;
    let totalRankings: number[] = [];
    let totalSources = 0;

    // Process each search query
    searchQueries.forEach((searchQuery) => {
      const searchResults = webSearches[searchQuery];
      const urls = Object.keys(searchResults);
      totalSources += urls.length;

      // Check if customer domain appears in this search
      let domainFound = false;
      urls.forEach((url) => {
        const urlDomain = extractDomain(url);
        if (
          urlDomain.includes(customerDomain) ||
          customerDomain.includes(urlDomain)
        ) {
          domainFound = true;
          const rankings = searchResults[url];
          totalRankings.push(...rankings);
        }
      });

      if (domainFound) {
        appearsInSearches++;
      }
    });

    // Calculate metrics
    const isMentioned = totalRankings.length > 0;
    const averageRanking = isMentioned
      ? totalRankings.reduce((sum, rank) => sum + rank, 0) /
        totalRankings.length
      : 0;
    const visibility = isMentioned
      ? Math.min(100, (appearsInSearches / totalSearches) * 100)
      : 0;

    // Create analysis result for each query in the prompt
    prompt.queries.forEach((query, index) => {
      results.push({
        id: `${prompt.id}-${index}`,
        query: query,
        prompt: apiResponse.prompt,
        isMentioned,
        averageRanking: Math.round(averageRanking * 10) / 10,
        totalSearches,
        appearsInSearches,
        totalSources,
        visibility: Math.round(visibility),
        category: prompt.category,
        timestamp: new Date(),
      });
    });
  });

  return results;
}

// Generate mock API response data
function generateMockAPIResponse(
  prompts: GeneratedPrompt[],
  websiteUrl: string
): APIResponseList {
  const customerDomain = extractDomain(websiteUrl);

  return prompts.map((prompt) => ({
    prompt: prompt.prompt,
    results: {
      "gemini-2.5-flash": [
        {
          model: "gemini-2.5-flash",
          response: `Here are some relevant companies and solutions for "${prompt.prompt}": AI bees, IInfotanks, Omnius, Rankstar.io, UnitedAds, Pearl Lemon, TRYSEO. These companies offer various AI-powered SEO solutions...`,
          web_searches: {
            [`${prompt.category.toLowerCase()} AI SEO companies`]: {
              "https://ai-bees.io": [1, 3],
              "https://iinfotanks.com": [2],
              [`https://${customerDomain}`]:
                Math.random() > 0.4 ? [Math.floor(Math.random() * 8) + 1] : [], // 60% chance of appearing
              "https://omnius.so": [4, 6],
              "https://rankstar.io": [5],
              "https://pearllemon.com": [7],
              "https://unitedads.com": [8],
              "https://tryseo.com": [9],
            },
            [`best ${prompt.category.toLowerCase()} tools 2024`]: {
              "https://semrush.com": [1],
              [`https://${customerDomain}`]:
                Math.random() > 0.5 ? [Math.floor(Math.random() * 6) + 2] : [], // 50% chance
              "https://ahrefs.com": [2],
              "https://moz.com": [3],
              "https://brightedge.com": [4],
              "https://searchenginejournal.com": [5],
            },
            [`${prompt.category.toLowerCase()} optimization strategies`]: {
              "https://searchengineland.com": [1],
              "https://backlinko.com": [2],
              [`https://${customerDomain}`]:
                Math.random() > 0.3 ? [Math.floor(Math.random() * 5) + 1] : [], // 70% chance
              "https://neilpatel.com": [3],
              "https://contentmarketinginstitute.com": [4],
            },
          },
          success: true,
          run_number: 1,
        },
      ],
    },
    summary: {
      "gemini-2.5-flash": {
        total_runs: 1,
        successful_runs: 1,
        success_rate: 1.0,
        total_web_searches: 3,
        unique_web_searches: 3,
        web_search_queries: [
          `${prompt.category.toLowerCase()} AI SEO companies`,
          `best ${prompt.category.toLowerCase()} tools 2024`,
          `${prompt.category.toLowerCase()} optimization strategies`,
        ],
      },
    },
  }));
}

export default function AnalyticsPage() {
  const [currentStep, setCurrentStep] = useState<AnalysisStep>("prompts");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[]>(
    []
  );
  const [analysisResults, setAnalysisResults] =
    useState<WebsiteAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (!urlParam) {
      router.push("/");
      return;
    }

    setWebsiteUrl(urlParam);

    // Simulate generating prompts
    const mockPrompts = [
      {
        id: "1",
        prompt: "What are the best AI SEO companies in Germany right now?",
        queries: [
          "best AI SEO companies Germany 2024",
          "top AI SEO agencies Germany",
          "leading AI SEO service providers Germany",
        ],
        category: "Integration",
        selected: true,
      },
      {
        id: "2",
        prompt: "How to optimize website content for AI search engines?",
        queries: [
          "AI search engine optimization techniques",
          "content optimization for AI crawlers",
          "SEO strategies for AI-powered search",
        ],
        category: "SEO",
        selected: true,
      },
      {
        id: "3",
        prompt: "What are the most effective AI-powered SEO tools?",
        queries: [
          "best AI SEO tools 2024",
          "AI-powered SEO software comparison",
          "top AI SEO platforms for businesses",
        ],
        category: "Tools",
        selected: true,
      },
      {
        id: "4",
        prompt: "How to implement semantic search on my website?",
        queries: [
          "semantic search implementation guide",
          "AI semantic search for websites",
          "how to add semantic search functionality",
        ],
        category: "Implementation",
        selected: true,
      },
      {
        id: "5",
        prompt: "Best practices for AI search analytics and monitoring?",
        queries: [
          "AI search analytics best practices",
          "monitoring AI search performance",
          "AI search tracking tools",
        ],
        category: "Analytics",
        selected: true,
      },
    ];

    setGeneratedPrompts(mockPrompts);
    setIsLoading(false);
  }, [searchParams, router]);

  const handlePromptsConfirm = (selectedPrompts: GeneratedPrompt[]) => {
    setGeneratedPrompts(selectedPrompts);
    setCurrentStep("analyzing");

    // Simulate analysis process
    setTimeout(() => {
      // Generate mock API response
      const mockApiResponse = generateMockAPIResponse(
        selectedPrompts,
        websiteUrl
      );

      // Process the API response
      const processedResults = processAPIResponse(
        mockApiResponse,
        websiteUrl,
        selectedPrompts
      );

      // Create website analysis
      const analysis: WebsiteAnalysis = {
        url: websiteUrl,
        totalQueries: processedResults.length,
        averageRanking:
          processedResults.filter((r) => r.averageRanking > 0).length > 0
            ? processedResults
                .filter((r) => r.averageRanking > 0)
                .reduce((sum, r) => sum + r.averageRanking, 0) /
              processedResults.filter((r) => r.averageRanking > 0).length
            : 0,
        overallVisibility:
          processedResults.length > 0
            ? Math.round(
                processedResults.reduce((sum, r) => sum + r.visibility, 0) /
                  processedResults.length
              )
            : 0,
        topCategory:
          selectedPrompts.length > 0 ? selectedPrompts[0].category : "N/A",
        results: processedResults,
      };

      setAnalysisResults(analysis);
      setCurrentStep("results");
    }, 3000);
  };

  const handleBack = () => {
    switch (currentStep) {
      case "prompts":
        router.push("/");
        break;
      case "analyzing":
        setCurrentStep("prompts");
        break;
      case "results":
        router.push("/");
        break;
    }
  };

  const handleNewAnalysis = () => {
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === "prompts" && (
          <PromptsStep
            prompts={generatedPrompts}
            onConfirm={handlePromptsConfirm}
            onBack={handleBack}
          />
        )}

        {currentStep === "analyzing" && <AnalyzingStep />}

        {currentStep === "results" && analysisResults && (
          <ResultsStep
            analysis={analysisResults}
            onNewAnalysis={handleNewAnalysis}
          />
        )}
      </main>
    </div>
  );
}
