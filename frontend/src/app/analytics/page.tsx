"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnalysisStep, GeneratedPrompt, WebsiteAnalysis } from "@/lib/types";
import PromptsStep from "@/components/analytics/PromptsStep";
import AnalyzingStep from "@/components/analytics/AnalyzingStep";
import ResultsStep from "@/components/analytics/ResultsStep";

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
        prompt: "How to integrate AI search into my website?",
        queries: [
          "integrating AI search into my website",
          "AI search integration best practices",
          "AI search engine optimization",
        ],
        category: "Integration",
        selected: true,
      },
      {
        id: "2",
        prompt: "Best practices for AI-powered site search",
        queries: [
          "AI-powered site search best practices",
          "AI search engine optimization",
          "AI search engine ranking",
        ],
        category: "Best Practices",
        selected: true,
      },
      {
        id: "3",
        prompt: "Optimize website content for AI crawlers",
        queries: [
          "AI crawler optimization",
          "AI search engine optimization",
          "AI search engine ranking",
        ],
        category: "SEO",
        selected: true,
      },
      {
        id: "4",
        prompt: "AI search analytics tools comparison",
        queries: [
          "AI search analytics tools comparison",
          "AI search engine optimization",
          "AI search engine ranking",
        ],
        category: "Tools",
        selected: true,
      },
      {
        id: "5",
        prompt: "Implement semantic search on my site",
        queries: [
          "semantic search implementation",
          "AI search engine optimization",
          "AI search engine ranking",
        ],
        category: "Implementation",
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
      const mockResults: WebsiteAnalysis = {
        url: websiteUrl,
        totalQueries: selectedPrompts.length,
        averageRanking: 4.2,
        overallVisibility: 72,
        topCategory: "SEO",
        results: selectedPrompts.flatMap((prompt) => {
          return prompt.queries.map((query) => {
            const isMentioned = Math.random() > 0.3; // 70% chance of being mentioned
            const mentionCount = isMentioned
              ? Math.floor(Math.random() * 8) + 1
              : 0;
            const competitorAverage = Math.floor(Math.random() * 5) + 2; // 2-7 average mentions
            const percentageDifference = isMentioned
              ? ((mentionCount - competitorAverage) / competitorAverage) * 100
              : -100; // -100% if not mentioned
            const favorabilityScore = isMentioned
              ? Math.floor(Math.random() * 40) + 60 // 60-100 if mentioned
              : 0; // 10-40 if not mentioned
            const totalSources = Math.floor(Math.random() * 15) + 5; // 5-20 sources

            return {
              id: prompt.id,
              query: query,
              prompt: prompt.prompt,
              isMentioned,
              mentionCount,
              favorabilityScore,
              competitorAverage,
              percentageDifference: Math.round(percentageDifference),
              totalSources,
              visibility: isMentioned ? Math.floor(Math.random() * 40) + 60 : 0,
              category: prompt.category,
              timestamp: new Date(),
            };
          });
        }),
      };
      setAnalysisResults(mockResults);
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
