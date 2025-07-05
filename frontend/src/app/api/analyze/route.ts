import { NextRequest, NextResponse } from "next/server";
import {
  GeneratedPrompt,
  WebsiteAnalysis,
  APIResponseList,
  AnalysisResult,
} from "@/lib/types";

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

export async function POST(request: NextRequest) {
  try {
    const { url, prompts } = await request.json();

    if (!url || !prompts || !Array.isArray(prompts)) {
      return NextResponse.json(
        {
          error: "URL and prompts are required",
        },
        { status: 400 }
      );
    }

    // Simulate processing time (3 seconds like in the original)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Generate mock API response
    const mockApiResponse = generateMockAPIResponse(prompts, url);

    // Process the API response
    const processedResults = processAPIResponse(mockApiResponse, url, prompts);

    // Create website analysis
    const analysis: WebsiteAnalysis = {
      url: url,
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
      topCategory: prompts.length > 0 ? prompts[0].category : "N/A",
      results: processedResults,
    };

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Error analyzing website:", error);
    return NextResponse.json(
      { error: "Failed to analyze website" },
      { status: 500 }
    );
  }
}
