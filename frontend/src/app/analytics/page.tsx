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
    const mockPrompts: GeneratedPrompt[] = [
      {
        id: "1",
        prompt: "How to integrate AI search into my website?",
        category: "Integration",
        selected: true,
      },
      {
        id: "2",
        prompt: "Best practices for AI-powered site search",
        category: "Best Practices",
        selected: true,
      },
      {
        id: "3",
        prompt: "Optimize website content for AI crawlers",
        category: "SEO",
        selected: true,
      },
      {
        id: "4",
        prompt: "AI search analytics tools comparison",
        category: "Tools",
        selected: true,
      },
      {
        id: "5",
        prompt: "Implement semantic search on my site",
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
        results: selectedPrompts.map((prompt, index) => ({
          id: prompt.id,
          query: prompt.prompt,
          prompt: prompt.prompt,
          ranking: Math.floor(Math.random() * 10) + 1,
          visibility: Math.floor(Math.random() * 40) + 60,
          clickPotential: Math.floor(Math.random() * 30) + 70,
          searchVolume: Math.floor(Math.random() * 5000) + 1000,
          difficulty: Math.floor(Math.random() * 100),
          category: prompt.category,
          timestamp: new Date(),
        })),
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
