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

  // Extract data from new Python API response format
  const data = pythonResponse.data || {};
  const intersectingQueries = data.intersecting_queries || {};

  // Extract domain from URL for matching
  const targetDomain = extractDomain(websiteUrl);

  // Create analysis results for each query in intersecting_queries
  let queryIndex = 0;
  Object.entries(intersectingQueries).forEach(
    ([query, queryData]: [string, any]) => {
      // Find which prompts this query belongs to
      const relatedPrompts = prompts.filter(
        (prompt) =>
          queryData.prompts && queryData.prompts.includes(prompt.prompt)
      );

      // If no related prompts found, try to match with any prompt for backwards compatibility
      const prompt = relatedPrompts.length > 0 ? relatedPrompts[0] : prompts[0];

      // Count how many prompts this query appears in
      const promptCount = queryData.prompts ? queryData.prompts.length : 1;

      // Check if target domain appears in this query
      const domainsWithCitations = queryData.domains_with_citations || {};
      const domainEntries = Object.entries(domainsWithCitations);

      // Find target domain in various formats
      const targetDomainEntry = domainEntries.find(([domain]) => {
        const cleanDomain = domain
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "");
        return (
          cleanDomain === targetDomain ||
          cleanDomain.includes(targetDomain) ||
          targetDomain.includes(cleanDomain)
        );
      });

      const isMentioned = !!targetDomainEntry;
      const citations = (
        targetDomainEntry ? targetDomainEntry[1] : []
      ) as number[];
      const averageRanking =
        isMentioned && citations.length > 0
          ? citations.reduce((sum: number, rank: number) => sum + rank, 0) /
            citations.length
          : 0;

      // Calculate metrics
      const totalDomains = queryData.total_domains || 0;
      const totalSearches = queryData.frequency || 1;
      const appearsInSearches = isMentioned ? 1 : 0;
      const visibility = isMentioned
        ? Math.max(10, 100 - averageRanking * 10)
        : 0;

      // Create citation distribution data for sparkline
      const citationDistribution: Array<{ position: number; count: number }> =
        [];
      const userDomainPositions: number[] = [];

      if (queryData.domains_with_citations) {
        // Count citations at each position
        const positionCounts: { [position: number]: number } = {};

        Object.entries(queryData.domains_with_citations).forEach(
          ([domain, citations]) => {
            const cleanDomain = domain
              .replace(/^https?:\/\//, "")
              .replace(/^www\./, "");
            const isUserDomain =
              cleanDomain === targetDomain ||
              cleanDomain.includes(targetDomain) ||
              targetDomain.includes(cleanDomain);

            (citations as number[]).forEach((position) => {
              positionCounts[position] = (positionCounts[position] || 0) + 1;

              if (isUserDomain) {
                userDomainPositions.push(position);
              }
            });
          }
        );

        // Convert to array format for sparkline
        const maxPosition = Math.max(
          ...Object.keys(positionCounts).map(Number)
        );
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
        isMentioned,
        averageRanking: Math.round(averageRanking * 10) / 10,
        totalSearches,
        appearsInSearches,
        totalSources: totalDomains,
        visibility: Math.round(visibility),
        promptCount,
        category: prompt?.category || "General",
        timestamp: new Date(),
        citationDistribution,
        userDomainPositions,
      });

      queryIndex++;
    }
  );

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
