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
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Eye,
  Search,
  RefreshCw,
  Calendar,
  Target,
  BarChart3,
} from "lucide-react";

interface ResultsStepProps {
  analysis: WebsiteAnalysis;
  onNewAnalysis: () => void;
}

export default function ResultsStep({
  analysis,
  onNewAnalysis,
}: ResultsStepProps) {
  // Define columns for the DataTable
  const columns = useMemo<ColumnDef<AnalysisResult>[]>(
    () => [
      {
        accessorKey: "query",
        header: "Query",
        cell: createCellRenderer.truncatedText(50),
        size: 300,
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: createCellRenderer.badge("secondary"),
      },
      {
        accessorKey: "isMentioned",
        header: "Domain Found",
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
        header: "Avg Ranking",
        cell: (info: any) => {
          const ranking = info.getValue() as number;
          if (ranking === 0) {
            return <span className="text-gray-400">N/A</span>;
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
        accessorKey: "appearsInSearches",
        header: "Search Coverage",
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
        header: "Total Sources",
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
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Domain Coverage
            </CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analysis.results.filter((r) => r.isMentioned).length}
                </div>
                <p className="text-xs text-muted-foreground">Found</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {analysis.results.filter((r) => !r.isMentioned).length}
                </div>
                <p className="text-xs text-muted-foreground">Not Found</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Ranking</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const rankedResults = analysis.results.filter(
                  (r) => r.averageRanking > 0
                );
                if (rankedResults.length === 0) return "N/A";
                const avgRanking =
                  rankedResults.reduce((sum, r) => sum + r.averageRanking, 0) /
                  rankedResults.length;
                return `#${avgRanking.toFixed(1)}`;
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              Average citation ranking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Search Coverage
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
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
                  ? `${((totalAppearances / totalSearches) * 100).toFixed(0)}%`
                  : "0%";
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall search coverage
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-full overflow-x-auto">
        <DataTable
          columns={columns}
          data={analysis.results}
          renderRowDetails={renderRowDetails}
          initialSorting={[{ id: "averageRanking", desc: false }]}
          getRowClassName={(row) => {
            const result = row.original as AnalysisResult;
            return result.isMentioned === false
              ? "bg-red-50 border-red-200"
              : "";
          }}
        />
      </div>
    </div>
  );
}
