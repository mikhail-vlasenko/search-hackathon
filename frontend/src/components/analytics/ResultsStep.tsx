"use client";

import { WebsiteAnalysis } from "@/lib/types";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { TrendingUp, Eye, MousePointer, Search, RefreshCw } from "lucide-react";

interface ResultsStepProps {
  analysis: WebsiteAnalysis;
  onNewAnalysis: () => void;
}

export default function ResultsStep({
  analysis,
  onNewAnalysis,
}: ResultsStepProps) {
  // Prepare data for charts
  const categoryData = analysis.results.reduce((acc, result) => {
    const existing = acc.find((item) => item.category === result.category);
    if (existing) {
      existing.count += 1;
      existing.avgVisibility = (existing.avgVisibility + result.visibility) / 2;
    } else {
      acc.push({
        category: result.category,
        count: 1,
        avgVisibility: result.visibility,
      });
    }
    return acc;
  }, [] as { category: string; count: number; avgVisibility: number }[]);

  const visibilityData = analysis.results.map((result, index) => ({
    query: `Q${index + 1}`,
    visibility: result.visibility,
    potential: result.clickPotential,
  }));

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <CardTitle className="text-sm font-medium">Avg. Ranking</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analysis.averageRanking.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Position in AI results
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Visibility Score
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analysis.overallVisibility}%
            </div>
            <p className="text-xs text-muted-foreground">Overall visibility</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.topCategory}</div>
            <p className="text-xs text-muted-foreground">Most relevant topic</p>
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
          <Card>
            <CardHeader>
              <CardTitle>AI Search Query Performance</CardTitle>
              <CardDescription>
                Detailed analysis of how your website performs for each
                AI-generated search query
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Query</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Ranking</TableHead>
                    <TableHead className="text-center">Visibility</TableHead>
                    <TableHead className="text-center">
                      Click Potential
                    </TableHead>
                    <TableHead className="text-center">Search Volume</TableHead>
                    <TableHead className="text-center">Difficulty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium max-w-xs">
                        {result.query}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{result.category}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-bold ${
                            result.ranking <= 3
                              ? "text-green-600"
                              : result.ranking <= 5
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          #{result.ranking}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {result.visibility}%
                      </TableCell>
                      <TableCell className="text-center">
                        {result.clickPotential}%
                      </TableCell>
                      <TableCell className="text-center">
                        {result.searchVolume.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-medium ${
                            result.difficulty < 30
                              ? "text-green-600"
                              : result.difficulty < 70
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {result.difficulty}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Visibility by Query</CardTitle>
                <CardDescription>
                  Comparing visibility and click potential across queries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={visibilityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="query" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="visibility"
                      stroke="#8884d8"
                      name="Visibility %"
                    />
                    <Line
                      type="monotone"
                      dataKey="potential"
                      stroke="#82ca9d"
                      name="Click Potential %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>
                  Breakdown of queries by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, count }) => `${category} (${count})`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Average Visibility by Category</CardTitle>
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
                      dataKey="avgVisibility"
                      fill="#8884d8"
                      name="Avg Visibility %"
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
