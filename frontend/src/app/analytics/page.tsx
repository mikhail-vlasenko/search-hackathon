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
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (!urlParam) {
      router.push("/");
      return;
    }

    setWebsiteUrl(urlParam);

    // Call the API to generate prompts
    const generatePrompts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/generate-prompts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: urlParam }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate prompts");
        }

        const data = await response.json();
        setGeneratedPrompts(data.prompts);
      } catch (err) {
        console.error("Error generating prompts:", err);
        setError("Failed to generate prompts. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    generatePrompts();
  }, [searchParams, router]);

  const handlePromptsConfirm = async (selectedPrompts: GeneratedPrompt[]) => {
    setGeneratedPrompts(selectedPrompts);
    setCurrentStep("analyzing");

    try {
      setError(null);

      // Call the API to analyze the website
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: websiteUrl,
          prompts: selectedPrompts,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze website");
      }

      const data = await response.json();
      setAnalysisResults(data.analysis);
      setCurrentStep("results");
    } catch (err) {
      console.error("Error analyzing website:", err);
      setError("Failed to analyze website. Please try again.");
      setCurrentStep("prompts");
    }
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
          <p className="text-gray-600">Loading prompts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="h-12 w-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-600">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
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
