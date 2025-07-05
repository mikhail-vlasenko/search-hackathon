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
                <div className="">Frequency</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>How many prompts this query appears in</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        cell: (info: any) => {
          const promptCount = info.getValue() as number;
          const percentage = (promptCount / analysis.results.length) * 100;
          return (
            <span className={`font-medium `}>
              {promptCount}{" "}
              <span className="text-slate-500">({percentage.toFixed(0)}%)</span>
            </span>
          );
        },
      },
      // {
      //   accessorKey: "category",
      //   header: () => (
      //     <TooltipProvider>
      //       <Tooltip>
      //         <TooltipTrigger asChild>
      //           <div className="">Category</div>
      //         </TooltipTrigger>
      //         <TooltipContent>
      //           <p>The topic category this query belongs to</p>
      //         </TooltipContent>
      //       </Tooltip>
      //     </TooltipProvider>
      //   ),
      //   cell: createCellRenderer.badge("secondary"),
      // },
      {
        accessorKey: "isMentioned",
        header: () => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="">Domain Found</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Whether your domain appears in AI search results for this
                  query
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        cell: (info: any) => {
          const isMentioned = info.getValue() as boolean;
          return isMentioned ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              Yes
            </Badge>
          ) : (
            <Badge variant="destructive">No</Badge>
          );
        },
      },
      {
        accessorKey: "averageRanking",
        header: () => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="">Avg Ranking</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Average citation ranking position when your domain appears
                  (lower is better)
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        cell: (info: any) => {
          const ranking = info.getValue() as number;
          if (ranking === 0) {
            return <span className="text-red-500">N/A</span>;
          }
          const colorClass =
            ranking <= 3
              ? "text-green-600"
              : ranking <= 5
              ? "text-yellow-600"
              : "text-red-600";
          return (
            <span className={`font-bold ${colorClass}`}>
              #{ranking.toFixed(1)}
            </span>
          );
        },
      },
      {
        accessorKey: "citationDistribution",
        header: () => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="">Citation Distribution</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Distribution of citations by ranking position. Red lines show
                  where your domain appears.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        cell: (info: any) => {
          const row = info.row.original as AnalysisResult;
          return <CitationSparkline data={row} />;
        },
      },
      {
        accessorKey: "appearsInSearches",
        header: () => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="">Search Coverage</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  How many related searches your domain appears in vs total
                  searches performed
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        cell: (info: any) => {
          const row = info.row.original as AnalysisResult;
          const coverage = row.appearsInSearches;
          const total = row.totalSearches;
          const percentage = total > 0 ? (coverage / total) * 100 : 0;

          const colorClass =
            percentage >= 80
              ? "text-green-600"
              : percentage >= 50
              ? "text-yellow-600"
              : "text-red-600";

          return (
            <span className={`font-medium ${colorClass}`}>
              {coverage}/{total} ({percentage.toFixed(0)}%)
            </span>
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
                <p>Total number of sources found across all related searches</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        cell: (info: any) => {
          const sources = info.getValue() as number;
          return <span className="text-gray-700">{sources}</span>;
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
                <span className="text-sm">Domain Found</span>
                {result.isMentioned ? (
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
                <span className="text-sm">Search Coverage</span>
                <span
                  className={`text-sm font-medium ${
                    result.totalSearches === 0
                      ? "text-gray-400"
                      : (result.appearsInSearches / result.totalSearches) *
                          100 >=
                        80
                      ? "text-green-600"
                      : (result.appearsInSearches / result.totalSearches) *
                          100 >=
                        50
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {result.appearsInSearches}/{result.totalSearches} (
                  {result.totalSearches > 0
                    ? (
                        (result.appearsInSearches / result.totalSearches) *
                        100
                      ).toFixed(0)
                    : 0}
                  %)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Category</span>
                <Badge variant="secondary" className="text-xs">
                  {result.category}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Prompt Frequency</span>
                <span
                  className={`text-sm font-medium ${
                    result.promptCount >= 3
                      ? "text-green-600"
                      : result.promptCount >= 2
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {result.promptCount} prompts
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
            {!result.isMentioned && (
              <div className="flex items-start space-x-2 text-sm">
                <Target className="h-4 w-4 text-red-500 mt-0.5" />
                <span>
                  Your domain doesn't appear in AI search results for this query
                  - create targeted content to increase visibility
                </span>
              </div>
            )}
            {result.isMentioned && result.averageRanking > 5 && (
              <div className="flex items-start space-x-2 text-sm">
                <Target className="h-4 w-4 text-orange-500 mt-0.5" />
                <span>
                  Your domain appears but ranks low - optimize content quality
                  and relevance to improve ranking
                </span>
              </div>
            )}
            {result.isMentioned &&
              (result.appearsInSearches / result.totalSearches) * 100 < 50 && (
                <div className="flex items-start space-x-2 text-sm">
                  <Eye className="h-4 w-4 text-blue-500 mt-0.5" />
                  <span>
                    Low search coverage - expand content to appear in more
                    related searches
                  </span>
                </div>
              )}
            {result.isMentioned &&
              result.averageRanking <= 3 &&
              (result.appearsInSearches / result.totalSearches) * 100 >= 80 && (
                <div className="flex items-start space-x-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>
                    Excellent performance! Your domain ranks well and appears
                    consistently - maintain content quality
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
      const notMentioned = analysis.results.filter((r) => !r.isMentioned);
      const poorlyRanked = analysis.results.filter(
        (r) => r.isMentioned && r.averageRanking > 5
      );

      if (notMentioned.length > 0) {
        advice.push({
          type: "critical",
          title: "Missing Domain Coverage",
          description: `Your domain doesn't appear in ${notMentioned.length} out of ${analysis.results.length} AI search queries.`,
          actions: [
            "Create comprehensive content targeting these specific query topics",
            "Ensure your content directly answers the questions users are asking",
            "Optimize meta descriptions and titles for better AI search comprehension",
          ],
          priority: "High",
          impact: "High Visibility Increase",
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

  return (
    <div className="space-y-6">
      {/* Top Row: Performance Overview and Competitive Insights */}
      <div className="flex gap-4">
        {/* Performance Overview */}
        <Card className="shrink-0 min-w-[320px]">
          <CardHeader className="shrink-0 pb-4">
            <CardTitle className="text-lg text-nowrap">
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="shrink-0 space-y-6">
            {/* Domain Coverage */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">
                How many queries is your domain found in?
              </h3>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {analysis.results.filter((r) => r.isMentioned).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Found</p>
                </div>
                <div className="text-gray-300 text-2xl font-light">/</div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {analysis.results.filter((r) => !r.isMentioned).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Missing</p>
                </div>
              </div>
            </div>

            {/* Avg Ranking */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">
                How well does your domain rank?
              </h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {(() => {
                    const rankedResults = analysis.results.filter(
                      (r) => r.averageRanking > 0
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
                <p className="text-sm text-muted-foreground">
                  Average citation position
                </p>
              </div>
            </div>

            {/* Search Coverage */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">
                How often does your domain appear?
              </h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {(() => {
                    const totalSearches = analysis.results.reduce(
                      (sum, r) => sum + r.totalSearches,
                      0
                    );
                    const totalAppearances = analysis.results.reduce(
                      (sum, r) => sum + r.appearsInSearches,
                      0
                    );
                    return totalSearches > 0
                      ? `${((totalAppearances / totalSearches) * 100).toFixed(
                          0
                        )}%`
                      : "0%";
                  })()}
                </div>
                <p className="text-sm text-muted-foreground">
                  Overall search coverage
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competitive Insights */}
        {apiResponse?.data?.competitive_insights && (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">Competitive Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2">
                <div>
                  {/* Competitive Advantages */}
                  {apiResponse.data.competitive_insights.competitive_advantages
                    ?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-gray-900 flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Competitive Advantages</span>
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {apiResponse.data.competitive_insights.competitive_advantages
                          .slice(0, 3)
                          .map((advantage: string, index: number) => (
                            <Badge
                              key={index}
                              variant="default"
                              className="text-xs"
                            >
                              {advantage}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
                  {/* Improvement Areas */}
                  {apiResponse.data.competitive_insights.improvement_areas
                    ?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-gray-900 flex items-center space-x-1">
                        <Target className="h-4 w-4 text-orange-500" />
                        <span>Improvement Areas</span>
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {apiResponse.data.competitive_insights.improvement_areas
                          .slice(0, 3)
                          .map((area: string, index: number) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {area}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Key Competitors */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-900 flex items-center space-x-1">
                    <Link className="h-4 w-4 text-blue-500" />
                    <span>Top Competitors</span>
                  </h4>
                  {apiResponse.data.competitive_insights.key_competitors
                    ?.length > 0 ? (
                    <div className="space-y-2">
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
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`h-2 w-2 rounded-full ${
                                    isStrong
                                      ? "bg-red-500"
                                      : isModerate
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                  }`}
                                />
                                <span className="text-sm font-medium truncate max-w-[150px]">
                                  {domain}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge
                                  variant={
                                    isStrong
                                      ? "destructive"
                                      : isModerate
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {frequency} mentions
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
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No competitor data available
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="max-w-full overflow-x-auto">
        <DataTable
          columns={columns}
          data={analysis.results}
          renderRowDetails={renderRowDetails}
          initialSorting={[{ id: "promptCount", desc: true }]}
          getRowClassName={(row) => {
            const result = row.original as AnalysisResult;
            return result.isMentioned === false
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
