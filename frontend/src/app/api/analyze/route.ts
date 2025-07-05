import { NextRequest, NextResponse } from "next/server";
import { GeneratedPrompt, WebsiteAnalysis, AnalysisResult } from "@/lib/types";
import fs from "fs";

// Function to extract domain from URL
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

// Function to transform Python API response to frontend format
function transformPythonResponseToAnalysis(
  pythonResponse: any,
  websiteUrl: string,
  prompts: GeneratedPrompt[]
): WebsiteAnalysis {
  const results: AnalysisResult[] = [];

  // Extract data from query_analysis section
  const queryAnalysis = pythonResponse.data?.query_analysis || {};

  // Create analysis results for each query in query_analysis
  let queryIndex = 0;
  Object.entries(queryAnalysis).forEach(([query, queryData]: [string, any]) => {
    // Find which prompts this query belongs to
    const relatedPrompts = prompts.filter(
      (prompt) =>
        queryData.prompts_using_query &&
        queryData.prompts_using_query.includes(prompt.prompt)
    );

    // If no related prompts found, try to match with any prompt for backwards compatibility
    const prompt = relatedPrompts.length > 0 ? relatedPrompts[0] : prompts[0];

    // Extract data from query_analysis
    const targetDomainRetrieved = queryData.target_domain_retrieved || false;
    const targetDomainCited = queryData.target_domain_cited || false;
    const totalSources = queryData.total_sources || 0;
    const promptsUsingQuery = queryData.prompts_using_query || [];
    const allDomains = queryData.all_domains || [];
    const targetDomainCitations = queryData.target_domain_citations || [];
    const avgCitationRank = queryData.avg_citation_rank || 0;
    const totalCitations = queryData.total_citations || 0;

    // Calculate metrics
    const averageRanking = avgCitationRank || 0;
    const visibility = targetDomainRetrieved
      ? Math.max(10, 100 - averageRanking * 10)
      : 0;

    // Create citation distribution data for sparkline
    const citationDistribution: Array<{ position: number; count: number }> = [];
    const userDomainPositions: number[] = targetDomainCitations;

    // Simple distribution based on citation positions
    if (targetDomainCitations.length > 0) {
      const positionCounts: { [position: number]: number } = {};
      targetDomainCitations.forEach((position: number) => {
        positionCounts[position] = (positionCounts[position] || 0) + 1;
      });

      const maxPosition = Math.max(...targetDomainCitations);
      for (let i = 1; i <= maxPosition; i++) {
        citationDistribution.push({
          position: i,
          count: positionCounts[i] || 0,
        });
      }
    }

    results.push({
      id: `query-${queryIndex}`,
      query: query,
      prompt: prompt?.prompt || "Unknown prompt",
      isMentioned: targetDomainRetrieved,
      averageRanking: Math.round(averageRanking * 10) / 10,
      totalSearches: 1, // Each query represents one search
      appearsInSearches: targetDomainRetrieved ? 1 : 0,
      totalSources: totalSources,
      visibility: Math.round(visibility),
      promptCount: promptsUsingQuery.length,
      category: prompt?.category || "General",
      timestamp: new Date(),
      citationDistribution,
      userDomainPositions,
      // Add new fields for query analysis
      targetDomainRetrieved,
      targetDomainCited,
      allDomains,
      promptsUsingQuery,
      totalCitations,
    });

    queryIndex++;
  });

  // Calculate aggregate metrics
  const totalQueries = results.length;
  const mentionedResults = results.filter((r) => r.isMentioned);
  const averageRanking =
    mentionedResults.length > 0
      ? mentionedResults.reduce((sum, r) => sum + r.averageRanking, 0) /
        mentionedResults.length
      : 0;
  const overallVisibility =
    results.length > 0
      ? Math.round(
          results.reduce((sum, r) => sum + r.visibility, 0) / results.length
        )
      : 0;

  // Get top category
  const categoryCount: { [key: string]: number } = {};
  results.forEach((result) => {
    categoryCount[result.category] = (categoryCount[result.category] || 0) + 1;
  });
  const topCategory =
    Object.entries(categoryCount).sort(([, a], [, b]) => b - a)[0]?.[0] ||
    "N/A";

  return {
    url: websiteUrl,
    totalQueries,
    averageRanking: Math.round(averageRanking * 10) / 10,
    overallVisibility,
    topCategory,
    results,
  };
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

    // Extract domain from URL
    const targetDomain = extractDomain(url);

    // Prepare request for Python API
    const pythonApiRequest = {
      target_domain: targetDomain,
      prompts: prompts.map((p) => p.prompt), // Convert to simple string array
    };

    // Make request to Python API
    const pythonApiUrl = "http://localhost:8000/analyze";

    try {
      const response = await fetch(pythonApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pythonApiRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Python API error: ${response.status} - ${errorText}`);
      }

      const pythonResponse = await response.json();
      console.log(JSON.stringify(pythonResponse, null, 2));
      // Write to file
      fs.writeFileSync(
        "pythonResponse.json",
        JSON.stringify(pythonResponse, null, 2)
      );

      if (!pythonResponse.success) {
        throw new Error(`Python API returned error: ${pythonResponse.error}`);
      }

      // Transform Python API response to frontend format
      const analysis = transformPythonResponseToAnalysis(
        pythonResponse,
        url,
        prompts
      );

      return NextResponse.json({ analysis, apiResponse: pythonResponse });
    } catch (fetchError) {
      console.error("Error calling Python API:", fetchError);
      return NextResponse.json(
        { error: "Failed to analyze website" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error analyzing website:", error);
    return NextResponse.json(
      { error: "Failed to analyze website" },
      { status: 500 }
    );
  }
}
