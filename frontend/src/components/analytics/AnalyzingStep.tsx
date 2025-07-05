"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Search, FileText, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";

export default function AnalyzingStep() {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: Search, label: "Crawling website content", duration: 30 },
    { icon: FileText, label: "Analyzing SEO metrics", duration: 40 },
    { icon: BarChart3, label: "Generating insights", duration: 30 },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress < 30) setCurrentStep(0);
    else if (progress < 70) setCurrentStep(1);
    else setCurrentStep(2);
  }, [progress]);

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <CardTitle>Analyzing Your Website</CardTitle>
          <CardDescription>
            This may take a few moments while we gather insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-600 mt-2 text-center">
              {progress}%
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isComplete = index < currentStep;

              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isActive ? "bg-primary/5 border border-primary/20" : ""
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-primary text-white"
                        : isComplete
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        isActive ? "text-gray-900" : "text-gray-600"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                  {isActive && (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
