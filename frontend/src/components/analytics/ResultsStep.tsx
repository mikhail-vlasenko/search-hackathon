"use client";

import React, { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { AnalysisResult, WebsiteAnalysis } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, createCellRenderer } from "@/components/ui/data-table";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
  ComposedChart,
} from "recharts";
import {
  TrendingUp,
  Eye,
  Search,
  RefreshCw,
  Calendar,
  Target,
  BarChart3,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  FileText,
  Link,
  Users,
  Hash,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ResultsStepProps {
  analysis: WebsiteAnalysis;
  onNewAnalysis: () => void;
  apiResponse?: any; // Add optional API response to access recommendations and competitive insights
}

// Citation Distribution Sparkline Component
const CitationSparkline = ({ data }: { data: AnalysisResult }) => {
  if (!data.citationDistribution || data.citationDistribution.length === 0) {
    return <span className="text-gray-400 text-xs">No data</span>;
  }

  const maxCount = Math.max(...data.citationDistribution.map((d) => d.count));
  const userPositions = data.userDomainPositions || [];

  return (
    <div className="w-32 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data.citationDistribution}
          margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
        >
          <Bar
            dataKey="count"
            fill="#e5e7eb"
            stroke="#d1d5db"
            strokeWidth={0.5}
            radius={[1, 1, 0, 0]}
          />
          {userPositions.map((position, index) => (
            <ReferenceLine
              key={index}
              x={position}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="none"
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// Citation Positions Distribution Component
const CitationPositionsDistribution = ({
  citationPositions,
}: {
  citationPositions: number[];
}) => {
  if (!citationPositions || citationPositions.length === 0) {
    return null;
  }

  // Create distribution data from citation positions
  const positionCounts: { [position: number]: number } = {};
  citationPositions.forEach((position) => {
    positionCounts[position] = (positionCounts[position] || 0) + 1;
  });

  const maxPosition = Math.max(...citationPositions);
  const distributionData = [];
  for (let i = 1; i <= maxPosition; i++) {
    distributionData.push({
      position: i,
      count: positionCounts[i] || 0,
    });
  }

  return (
    <div className="w-full h-12">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={distributionData}
          margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
        >
          <XAxis
            dataKey="position"
            tick={{ fontSize: 8 }}
            axisLine={false}
            tickLine={false}
          />
          <Bar
            dataKey="count"
            fill="#3b82f6"
            stroke="#2563eb"
            strokeWidth={0.5}
            radius={[1, 1, 0, 0]}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function ResultsStep({
  analysis,
  onNewAnalysis,
  apiResponse,
}: ResultsStepProps) {
  // Define columns for the DataTable
  const columns = useMemo<ColumnDef<AnalysisResult>[]>(
    () => [
      {
        accessorKey: "query",
        header: () => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="">Query</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>The search query used to test AI search engines</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        cell: createCellRenderer.truncatedText(50),
        size: 300,
      },
      {
        accessorKey: "promptCount",
        header: () => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="">Prompts Using Query</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Number of prompts that generated this query</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        cell: (info: any) => {
          const promptCount = info.getValue() as number;
          return <span className="font-medium">{promptCount}</span>;
        },
      },
      {
        accessorKey: "targetDomainRetrieved",
        header: () => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="">Domain Retrieved</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Whether your domain was retrieved in search results</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        cell: (info: any) => {
          const retrieved = info.getValue() as boolean;
          return retrieved ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              Yes
            </Badge>
          ) : (
            <Badge variant="destructive">No</Badge>
          );
        },
      },
      {
        accessorKey: "targetDomainCited",
        header: () => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="">Domain Cited</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Whether your domain was cited in AI responses</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        cell: (info: any) => {
          const cited = info.getValue() as boolean;
          return cited ? (
            <Badge variant="default" className="bg-blue-100 text-blue-800">
              Yes
            </Badge>
          ) : (
            <Badge variant="secondary">No</Badge>
          );
        },
      },
      {
        accessorKey: "totalSources",
        header: () => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="">Total Sources</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total number of sources found for this query</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        cell: (info: any) => {
          const sources = info.getValue() as number;
          return <span className="text-gray-700">{sources}</span>;
        },
      },
      {
        accessorKey: "totalCitations",
        header: () => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="">Citations</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total number of citations for your domain</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        cell: (info: any) => {
          const citations = info.getValue() as number;
          return <span className="text-gray-700">{citations}</span>;
        },
      },
    ],
    []
  );

  // Row details renderer
  const renderRowDetails = (row: any) => {
    const result = row.original as AnalysisResult;

    return (
      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-2">
            Query
          </h4>
          <p className="text-sm">{result.query}</p>
        </div>

        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-2">
            Full Prompt
          </h4>
          <p className="text-sm text-muted-foreground">{result.prompt}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">
              Domain Performance
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Domain Retrieved</span>
                {result.targetDomainRetrieved ? (
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800 text-xs"
                  >
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    No
                  </Badge>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Domain Cited</span>
                {result.targetDomainCited ? (
                  <Badge
                    variant="default"
                    className="bg-blue-100 text-blue-800 text-xs"
                  >
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    No
                  </Badge>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Citations</span>
                <span className="text-sm font-medium text-gray-700">
                  {result.totalCitations}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Average Ranking</span>
                <span
                  className={`text-sm font-medium ${
                    result.averageRanking === 0
                      ? "text-gray-400"
                      : result.averageRanking <= 3
                      ? "text-green-600"
                      : result.averageRanking <= 5
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {result.averageRanking === 0
                    ? "N/A"
                    : `#${result.averageRanking.toFixed(1)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Category</span>
                <Badge variant="secondary" className="text-xs">
                  {result.category}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Prompts Using Query</span>
                <span className="text-sm font-medium text-gray-700">
                  {result.promptCount}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">
              Search Metrics
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Sources</span>
                <span className="text-sm font-medium text-gray-700">
                  {result.totalSources}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Visibility</span>
                <span className="text-sm font-medium text-gray-700">
                  {result.visibility}%
                </span>
              </div>
              {result.citationDistribution &&
                result.citationDistribution.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Citation Positions</span>
                      <span className="text-sm font-medium text-gray-700">
                        {result.citationDistribution.reduce(
                          (sum, d) => sum + d.count,
                          0
                        )}{" "}
                        total
                      </span>
                    </div>
                    <div className="w-full h-16">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={result.citationDistribution}
                          margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                        >
                          <XAxis
                            dataKey="position"
                            tick={{ fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Bar
                            dataKey="count"
                            fill="#e5e7eb"
                            stroke="#d1d5db"
                            strokeWidth={0.5}
                            radius={[2, 2, 0, 0]}
                          />
                          {result.userDomainPositions?.map(
                            (position, index) => (
                              <ReferenceLine
                                key={index}
                                x={position}
                                stroke="#ef4444"
                                strokeWidth={2}
                                strokeDasharray="none"
                              />
                            )
                          )}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    {result.userDomainPositions &&
                      result.userDomainPositions.length > 0 && (
                        <div className="text-xs text-gray-600">
                          <span className="inline-block w-2 h-2 bg-red-500 mr-1"></span>
                          Your domain appears at positions:{" "}
                          {result.userDomainPositions.join(", ")}
                        </div>
                      )}
                  </div>
                )}
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-2">
            All Domains Found
          </h4>
          <div className="max-h-32 overflow-y-auto">
            <div className="grid grid-cols-2 gap-1">
              {result.allDomains.map((domain, index) => (
                <div
                  key={index}
                  className="text-xs bg-gray-50 px-2 py-1 rounded truncate"
                  title={domain}
                >
                  {domain}
                </div>
              ))}
            </div>
            {result.allDomains.length === 0 && (
              <span className="text-xs text-gray-500 italic">
                No domains found
              </span>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-2">
            Prompts Using This Query
          </h4>
          <div className="max-h-24 overflow-y-auto space-y-1">
            {result.promptsUsingQuery.map((prompt, index) => (
              <div key={index} className="text-xs bg-blue-50 px-2 py-1 rounded">
                {prompt}
              </div>
            ))}
            {result.promptsUsingQuery.length === 0 && (
              <span className="text-xs text-gray-500 italic">
                No prompts found
              </span>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-2">
            Analysis Date
          </h4>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{new Date(result.timestamp).toLocaleDateString()}</span>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-2">
            Recommendations
          </h4>
          <div className="space-y-2">
            {!result.targetDomainRetrieved && (
              <div className="flex items-start space-x-2 text-sm">
                <Target className="h-4 w-4 text-red-500 mt-0.5" />
                <span>
                  Your domain wasn't retrieved in search results for this query
                  - create targeted content to increase visibility
                </span>
              </div>
            )}
            {result.targetDomainRetrieved && !result.targetDomainCited && (
              <div className="flex items-start space-x-2 text-sm">
                <Target className="h-4 w-4 text-orange-500 mt-0.5" />
                <span>
                  Your domain was retrieved but not cited - improve content
                  quality and authority to get citations
                </span>
              </div>
            )}
            {result.targetDomainRetrieved && result.averageRanking > 5 && (
              <div className="flex items-start space-x-2 text-sm">
                <Target className="h-4 w-4 text-orange-500 mt-0.5" />
                <span>
                  Your domain appears but ranks low - optimize content quality
                  and relevance to improve ranking
                </span>
              </div>
            )}
            {result.targetDomainRetrieved &&
              result.targetDomainCited &&
              result.averageRanking <= 3 && (
                <div className="flex items-start space-x-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>
                    Excellent performance! Your domain is retrieved, cited, and
                    ranks well - maintain content quality
                  </span>
                </div>
              )}
          </div>
        </div>
      </div>
    );
  };

  // Generate actionable advice based on analysis results and API response
  const generateActionableAdvice = () => {
    const advice = [];

    // Use API recommendations if available
    if (apiResponse?.data?.recommendations) {
      apiResponse.data.recommendations.forEach((rec: string, index: number) => {
        advice.push({
          type: rec.includes("Low")
            ? "warning"
            : rec.includes("Excellent")
            ? "success"
            : "info",
          title: `API Recommendation ${index + 1}`,
          description: rec,
          actions: [
            rec.includes("SEO")
              ? "Improve SEO and content relevance"
              : rec.includes("content quality")
              ? "Focus on improving content quality and authority"
              : rec.includes("content quality")
              ? "Maintain current content quality and SEO strategy"
              : "Follow the specific guidance provided",
          ],
          priority: rec.includes("Low") ? "High" : "Medium",
          impact: rec.includes("Low")
            ? "High Visibility Increase"
            : "Performance Improvement",
        });
      });
    }

    // Add competitive insights if available
    if (apiResponse?.data?.competitive_insights) {
      const insights = apiResponse.data.competitive_insights;

      advice.push({
        type: "info",
        title: "Market Position Analysis",
        description: `Your market position is assessed as: ${insights.market_position?.replace(
          "_",
          " "
        )}`,
        actions: [
          ...(insights.improvement_areas || []).map(
            (area: string) => `Address: ${area}`
          ),
          ...(insights.competitive_advantages || []).map(
            (adv: string) => `Leverage: ${adv}`
          ),
        ],
        priority: "Medium",
        impact: "Strategic Positioning",
      });
    }

    // Fallback to original analysis if no API recommendations
    if (advice.length === 0) {
      const notRetrieved = analysis.results.filter(
        (r) => !r.targetDomainRetrieved
      );
      const retrievedButNotCited = analysis.results.filter(
        (r) => r.targetDomainRetrieved && !r.targetDomainCited
      );
      const poorlyRanked = analysis.results.filter(
        (r) => r.targetDomainRetrieved && r.averageRanking > 5
      );

      if (notRetrieved.length > 0) {
        advice.push({
          type: "critical",
          title: "Missing Domain Retrieval",
          description: `Your domain wasn't retrieved in ${notRetrieved.length} out of ${analysis.results.length} AI search queries.`,
          actions: [
            "Create comprehensive content targeting these specific query topics",
            "Ensure your content directly answers the questions users are asking",
            "Optimize meta descriptions and titles for better AI search comprehension",
            "Improve SEO fundamentals to increase search visibility",
          ],
          priority: "High",
          impact: "High Visibility Increase",
        });
      }

      if (retrievedButNotCited.length > 0) {
        advice.push({
          type: "warning",
          title: "Retrieved but Not Cited",
          description: `Your domain was retrieved but not cited in ${retrievedButNotCited.length} queries.`,
          actions: [
            "Improve content quality and depth for better authority signals",
            "Add more relevant internal and external links",
            "Update content with latest information and statistics",
            "Create more authoritative and comprehensive content",
          ],
          priority: "Medium",
          impact: "Better Citation Rate",
        });
      }

      if (poorlyRanked.length > 0) {
        advice.push({
          type: "warning",
          title: "Poor Ranking Performance",
          description: `Your domain appears but ranks poorly (position 6+) in ${poorlyRanked.length} queries.`,
          actions: [
            "Improve content quality and depth for better authority signals",
            "Add more relevant internal and external links",
            "Update content with latest information and statistics",
            "Optimize content structure for better search engine understanding",
          ],
          priority: "Medium",
          impact: "Better Positioning",
        });
      }
    }

    return advice;
  };

  const actionableAdvice = generateActionableAdvice();

  // Prepare data for charts
  // const categoryData = analysis.results.reduce((acc, result) => {
  //   const existing = acc.find((item) => item.category === result.category);
  //   if (existing) {
  //     existing.count += 1;
  //     existing.avgFavorability =
  //       (existing.avgFavorability + result.favorabilityScore) / 2;
  //     existing.avgMentions = (existing.avgMentions + result.mentionCount) / 2;
  //   } else {
  //     acc.push({
  //       category: result.category,
  //       count: 1,
  //       avgFavorability: result.favorabilityScore,
  //       avgMentions: result.mentionCount,
  //     });
  //   }
  //   return acc;
  // }, [] as { category: string; count: number; avgFavorability: number; avgMentions: number }[]);

  // const performanceData = analysis.results.map((result, index) => ({
  //   query: `Q${index + 1}`,
  //   favorabilityScore: result.favorabilityScore,
  //   mentionCount: result.mentionCount,
  //   competitorAverage: result.competitorAverage,
  //   isMentioned: result.isMentioned,
  // }));

  // Prepare data for pie chart
  const domainCoverageData = [
    {
      name: "Retrieved",
      value: analysis.results.filter((r) => r.targetDomainRetrieved).length,
      color: "#16a34a", // green-600
    },
    {
      name: "Missing",
      value: analysis.results.filter((r) => !r.targetDomainRetrieved).length,
      color: "#dc2626", // red-600
    },
  ];

  // Prepare data for citation chart (of retrieved domains)
  const retrievedResults = analysis.results.filter(
    (r) => r.targetDomainRetrieved
  );
  const citationData = [
    {
      name: "Cited",
      value: retrievedResults.filter((r) => r.targetDomainCited).length,
      color: "#2563eb", // blue-600
    },
    {
      name: "Not Cited",
      value: retrievedResults.filter((r) => !r.targetDomainCited).length,
      color: "#9ca3af", // gray-400
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Row - Overview and Pie Chart */}
      <div className="flex gap-6">
        {/* Compact Overview */}
        <Card className="flex-1">
          <CardHeader className="">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Performance Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex w-full gap-6">
              {/* Performance Metrics Column */}
              <div className="space-y-4 flex-1">
                {/* Domain Coverage */}
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-700">
                    How many queries is your domain found in?
                  </h3>
                  <div className="flex items-center pl-2 gap-2">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {
                          analysis.results.filter(
                            (r) => r.targetDomainRetrieved
                          ).length
                        }
                      </div>
                      <p className="text-xs text-muted-foreground">Retrieved</p>
                    </div>
                    <div className="text-gray-300 text-lg font-light">/</div>
                    <div className="">
                      <div className="text-2xl font-bold text-red-600">
                        {
                          analysis.results.filter(
                            (r) => !r.targetDomainRetrieved
                          ).length
                        }
                      </div>
                      <p className="text-xs text-muted-foreground">Missing</p>
                    </div>
                  </div>
                </div>

                {/* Avg Ranking */}
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-700">
                    How well does your domain rank?
                  </h3>
                  <div className="flex items-start space-x-4">
                    <div className="pl-2">
                      <div className="text-2xl font-bold text-blue-600">
                        {(() => {
                          const rankedResults = analysis.results.filter(
                            (r) =>
                              r.targetDomainRetrieved && r.averageRanking > 0
                          );
                          if (rankedResults.length === 0) return "N/A";
                          const avgRanking =
                            rankedResults.reduce(
                              (sum, r) => sum + r.averageRanking,
                              0
                            ) / rankedResults.length;
                          return `#${avgRanking.toFixed(1)}`;
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Average citation position
                      </p>
                    </div>

                    {/* Citation Positions Distribution */}
                    {apiResponse?.data?.domain_analysis?.citation_positions && (
                      <div className="flex-1 max-w-[120px]">
                        <CitationPositionsDistribution
                          citationPositions={
                            apiResponse.data.domain_analysis.citation_positions
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Position distribution
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Competitive Insights Column */}
              {apiResponse?.data?.competitive_insights && (
                <div className="flex gap-2 flex-1">
                  <div className="flex flex-col gap-6 mr-6">
                    {/* Competitive Advantages */}
                    {apiResponse.data.competitive_insights
                      .competitive_advantages?.length > 0 && (
                      <div className="space-y-1">
                        <h4 className="font-medium text-xs text-gray-900 flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>Competitive Advantages</span>
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {apiResponse.data.competitive_insights.competitive_advantages
                            .slice(0, 3)
                            .map((advantage: string, index: number) => (
                              <Badge
                                key={index}
                                variant="default"
                                className="text-xs px-1 py-0"
                              >
                                {advantage}
                              </Badge>
                            ))}
                          {apiResponse.data.competitive_insights
                            .competitive_advantages.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{" "}
                              {apiResponse.data.competitive_insights
                                .competitive_advantages.length - 3}{" "}
                              more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Improvement Areas */}
                    {apiResponse.data.competitive_insights.improvement_areas
                      ?.length > 0 && (
                      <div className="space-y-1">
                        <h4 className="font-medium text-xs text-gray-900 flex items-center space-x-1">
                          <Target className="h-3 w-3 text-orange-500" />
                          <span>Improvement Areas</span>
                        </h4>
                        <div className="flex flex-col gap-1">
                          {apiResponse.data.competitive_insights.improvement_areas
                            .slice(0, 3)
                            .map((area: string, index: number) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs px-1 py-0"
                              >
                                {area}
                              </Badge>
                            ))}
                          {apiResponse.data.competitive_insights
                            .improvement_areas.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{" "}
                              {apiResponse.data.competitive_insights
                                .improvement_areas.length - 3}{" "}
                              more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Key Competitors */}
                  <div className="space-y-1 flex-1 min-w-[300px]">
                    <h4 className="font-medium text-xs text-gray-900 flex items-center space-x-1">
                      <Link className="h-3 w-3 text-blue-500" />
                      <span>Top Competitors</span>
                    </h4>
                    {apiResponse.data.competitive_insights.key_competitors
                      ?.length > 0 ? (
                      <div className="space-y-1">
                        {apiResponse.data.competitive_insights.key_competitors
                          .slice(0, 3)
                          .map((competitor: any, index: number) => {
                            const domain = competitor.domain.replace(
                              /^https?:\/\//,
                              ""
                            );
                            const frequency = competitor.frequency;
                            const isStrong = frequency >= 5;
                            const isModerate = frequency >= 3 && frequency < 5;

                            return (
                              <div
                                key={index}
                                className="flex items-center justify-between p-1 bg-gray-50 rounded text-xs"
                              >
                                <div className="flex items-center space-x-1">
                                  <div
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      isStrong
                                        ? "bg-red-500"
                                        : isModerate
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                    }`}
                                  />
                                  <span className="font-medium truncate max-w-[120px]">
                                    {domain}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Badge
                                    variant={
                                      isStrong
                                        ? "destructive"
                                        : isModerate
                                        ? "default"
                                        : "secondary"
                                    }
                                    className="text-xs px-1 py-0"
                                  >
                                    {frequency}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {isStrong
                                      ? "Strong"
                                      : isModerate
                                      ? "Moderate"
                                      : "Weak"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        {apiResponse.data.competitive_insights.key_competitors
                          .length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{" "}
                            {apiResponse.data.competitive_insights
                              .key_competitors.length - 3}{" "}
                            more competitors
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">
                        No competitor data available
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Charts Container */}
        <div className="min-w-[600px]">
          <div className="flex gap-6">
            {/* Domain Coverage Pie Chart */}
            <div className="flex-1">
              <div className="mb-3">
                <h3 className="text-lg font-semibold">Domain Coverage</h3>
                <p className="text-sm text-gray-600">
                  Distribution of queries where your domain appears
                </p>
              </div>
              <div className="flex items-center justify-center h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={domainCoverageData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      innerRadius={30}
                      paddingAngle={2}
                      dataKey="value"
                      labelLine={false}
                    >
                      {domainCoverageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <span className="text-sm font-medium">
                    Retrieved ({domainCoverageData[0].value})
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                  <span className="text-sm font-medium">
                    Missing ({domainCoverageData[1].value})
                  </span>
                </div>
              </div>
            </div>

            {/* Citation Rate Chart */}
            <div className="w-72">
              <div className="mb-3">
                <h3 className="text-base font-semibold">Citation Rate</h3>
                <p className="text-sm text-gray-600">
                  Of retrieved domains, how many got cited
                </p>
              </div>
              <div className="flex items-center justify-center h-48">
                {retrievedResults.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={citationData}
                        cx="50%"
                        cy="50%"
                        outerRadius={45}
                        innerRadius={20}
                        paddingAngle={2}
                        dataKey="value"
                        labelLine={false}
                      >
                        {citationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <FileText className="h-8 w-8 mb-2" />
                    <p className="text-sm text-center">
                      No retrieved domains
                      <br />
                      to analyze
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-center space-x-4 mt-2">
                {retrievedResults.length > 0 ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      <span className="text-sm font-medium">
                        Cited ({citationData[0].value})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span className="text-sm font-medium">
                        Not Cited ({citationData[1].value})
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-gray-500">
                    No data to display
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Citation Positions Distribution */}
          {apiResponse?.data?.domain_analysis?.citation_positions && (
            <div className="mt-4">
              <div className="mb-2">
                <h4 className="text-sm font-medium text-gray-700">
                  Citation Positions Distribution
                </h4>
                <p className="text-xs text-gray-500">
                  Position distribution of your domain citations across all
                  responses
                </p>
              </div>
              <CitationPositionsDistribution
                citationPositions={
                  apiResponse.data.domain_analysis.citation_positions
                }
              />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <DataTable
          columns={columns}
          data={analysis.results}
          renderRowDetails={renderRowDetails}
          initialSorting={[{ id: "promptCount", desc: true }]}
          getRowClassName={(row) => {
            const result = row.original as AnalysisResult;
            return result.targetDomainRetrieved === false
              ? "bg-red-50 border-red-200"
              : "";
          }}
          maxHeight="50vh"
        />
      </div>

      {/* Actionable Advice Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actionableAdvice.map((advice, index) => (
              <div
                key={index}
                className="border rounded-lg p-3 space-y-2 min-w-[300px] flex-shrink-0"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {advice.type === "critical" && (
                      <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                    {advice.type === "warning" && (
                      <Target className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    )}
                    {advice.type === "success" && (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                    {advice.type === "info" && (
                      <Lightbulb className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    )}
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900">
                        {advice.title}
                      </h4>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge
                      variant={
                        advice.priority === "High"
                          ? "destructive"
                          : advice.priority === "Medium"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {advice.priority}
                    </Badge>
                  </div>
                </div>

                <p className="text-xs text-gray-600">{advice.description}</p>

                <div className="space-y-1">
                  <h5 className="font-medium text-xs text-gray-800 flex items-center space-x-1">
                    <ArrowUp className="h-3 w-3" />
                    <span>Actions:</span>
                  </h5>
                  <ul className="space-y-1">
                    {advice.actions.slice(0, 3).map((action, actionIndex) => (
                      <li
                        key={actionIndex}
                        className="flex items-start space-x-1 text-xs"
                      >
                        <span className="text-gray-400 mt-0.5">•</span>
                        <span className="text-gray-700 line-clamp-2">
                          {action}
                        </span>
                      </li>
                    ))}
                    {advice.actions.length > 3 && (
                      <li className="text-xs text-gray-500 italic">
                        +{advice.actions.length - 3} more actions...
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
