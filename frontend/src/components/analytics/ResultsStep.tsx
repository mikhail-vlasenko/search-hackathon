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
      // {
      //   accessorKey: "prompt",
      //   header: "Prompt",
      //   cell: createCellRenderer.truncatedText(30),
      //   size: 300,
      // },
      {
        accessorKey: "category",
        header: "Category",
        cell: createCellRenderer.badge("secondary"),
      },
      {
        accessorKey: "isMentioned",
        header: "Mentioned",
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
        accessorKey: "mentionCount",
        header: "Mentions",
        cell: (info: any) => {
          const count = info.getValue() as number;
          return count === 0 ? (
            <span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
              0
            </span>
          ) : (
            <span className="font-bold text-green-600">{count}</span>
          );
        },
      },
      {
        accessorKey: "favorabilityScore",
        header: "Favorability",
        cell: (info: any) => {
          const score = info.getValue() as number;
          const colorClass =
            score >= 70
              ? "text-green-600"
              : score >= 50
              ? "text-yellow-600"
              : "text-red-600";
          return (
            <span className={`font-medium ${colorClass}`}>{score}/100</span>
          );
        },
      },
      {
        accessorKey: "competitorAverage",
        header: "Competitor Avg",
        cell: (info: any) => {
          const avg = info.getValue() as number;
          return <span className="text-gray-600">{avg}</span>;
        },
      },
      {
        accessorKey: "percentageDifference",
        header: "vs Competitors",
        cell: (info: any) => {
          const diff = info.getValue() as number;
          const colorClass =
            diff > 0
              ? "text-green-600"
              : diff < 0
              ? "text-red-600"
              : "text-gray-600";
          const prefix = diff > 0 ? "+" : "";
          return (
            <span className={`font-medium ${colorClass}`}>
              {prefix}
              {diff}%
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
              Mention Performance
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Mentioned</span>
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
                <span className="text-sm">Mention Count</span>
                <span
                  className={`text-sm font-medium ${
                    result.mentionCount === 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {result.mentionCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Favorability Score</span>
                <span
                  className={`text-sm font-medium ${
                    result.favorabilityScore >= 70
                      ? "text-green-600"
                      : result.favorabilityScore >= 50
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {result.favorabilityScore}/100
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
              Competitive Analysis
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Competitor Avg</span>
                <span className="text-sm font-medium text-gray-600">
                  {result.competitorAverage}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">vs Competitors</span>
                <span
                  className={`text-sm font-medium ${
                    result.percentageDifference > 0
                      ? "text-green-600"
                      : result.percentageDifference < 0
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {result.percentageDifference > 0 ? "+" : ""}
                  {result.percentageDifference}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Sources</span>
                <span className="text-sm font-medium text-gray-700">
                  {result.totalSources}
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
                  Create content specifically targeting this query to get
                  mentioned in AI search results
                </span>
              </div>
            )}
            {result.isMentioned &&
              result.mentionCount < result.competitorAverage && (
                <div className="flex items-start space-x-2 text-sm">
                  <Target className="h-4 w-4 text-orange-500 mt-0.5" />
                  <span>
                    Optimize content to increase mention frequency and beat
                    competitors
                  </span>
                </div>
              )}
            {result.favorabilityScore < 50 && (
              <div className="flex items-start space-x-2 text-sm">
                <Eye className="h-4 w-4 text-blue-500 mt-0.5" />
                <span>
                  Low favorability score - improve content quality and relevance
                </span>
              </div>
            )}
            {result.isMentioned &&
              result.mentionCount >= result.competitorAverage &&
              result.favorabilityScore >= 70 && (
                <div className="flex items-start space-x-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>
                    Excellent performance! Maintain content quality and monitor
                    competition
                  </span>
                </div>
              )}
          </div>
        </div>
      </div>
    );
  };

  // Prepare data for charts
  const categoryData = analysis.results.reduce((acc, result) => {
    const existing = acc.find((item) => item.category === result.category);
    if (existing) {
      existing.count += 1;
      existing.avgFavorability =
        (existing.avgFavorability + result.favorabilityScore) / 2;
      existing.avgMentions = (existing.avgMentions + result.mentionCount) / 2;
    } else {
      acc.push({
        category: result.category,
        count: 1,
        avgFavorability: result.favorabilityScore,
        avgMentions: result.mentionCount,
      });
    }
    return acc;
  }, [] as { category: string; count: number; avgFavorability: number; avgMentions: number }[]);

  const performanceData = analysis.results.map((result, index) => ({
    query: `Q${index + 1}`,
    favorabilityScore: result.favorabilityScore,
    mentionCount: result.mentionCount,
    competitorAverage: result.competitorAverage,
    isMentioned: result.isMentioned,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Query Mentions
            </CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analysis.results.filter((r) => r.isMentioned).length}
                </div>
                <p className="text-xs text-muted-foreground">Mentioned</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {analysis.results.filter((r) => !r.isMentioned).length}
                </div>
                <p className="text-xs text-muted-foreground">Not Mentioned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Favorability
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                analysis.results.reduce(
                  (sum, r) => sum + r.favorabilityScore,
                  0
                ) / analysis.results.length
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Average favorability score
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-full overflow-x-auto">
        <DataTable
          columns={columns}
          data={analysis.results}
          renderRowDetails={renderRowDetails}
          initialSorting={[{ id: "mentionCount", desc: true }]}
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
