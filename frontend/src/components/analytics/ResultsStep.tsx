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

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.totalQueries}</div>
            <p className="text-xs text-muted-foreground">
              AI search queries analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mentioned Queries
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analysis.results.filter((r) => r.isMentioned).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Queries with mentions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Mentioned</CardTitle>
            <Target className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analysis.results.filter((r) => !r.isMentioned).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Queries without mentions
            </p>
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

      {/* Main Content Tabs */}
      <Tabs defaultValue="table" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="table">Query Analysis</TabsTrigger>
            <TabsTrigger value="charts">Visualizations</TabsTrigger>
          </TabsList>
          <Button onClick={onNewAnalysis} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            New Analysis
          </Button>
        </div>

        <TabsContent value="table" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Favorability vs Mentions</CardTitle>
                <CardDescription>
                  Relationship between favorability score and mention count
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="query" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="favorabilityScore"
                      stroke="#8884d8"
                      name="Favorability Score"
                    />
                    <Line
                      type="monotone"
                      dataKey="mentionCount"
                      stroke="#ff7300"
                      name="Mention Count"
                      yAxisId="right"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Competitor Analysis</CardTitle>
                <CardDescription>
                  Comparison with average competitor performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Below Competitor Avg",
                          value: performanceData.filter(
                            (d) => d.mentionCount < d.competitorAverage
                          ).length,
                          color: "#FF8042",
                        },
                        {
                          name: "Above Competitor Avg",
                          value: performanceData.filter(
                            (d) => d.mentionCount >= d.competitorAverage
                          ).length,
                          color: "#00C49F",
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#00C49F" />
                      <Cell fill="#FF8042" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Average Favorability by Category</CardTitle>
                <CardDescription>
                  How well your content performs across different topic
                  categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="avgFavorability"
                      fill="#8884d8"
                      name="Avg Favorability"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
