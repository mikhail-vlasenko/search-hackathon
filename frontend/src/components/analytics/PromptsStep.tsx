"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ArrowRight, ArrowLeft } from "lucide-react";
import { GeneratedPrompt } from "@/lib/types";

interface PromptsStepProps {
  prompts: GeneratedPrompt[];
  onConfirm: (selectedPrompts: GeneratedPrompt[]) => void;
  onBack: () => void;
}

export default function PromptsStep({
  prompts,
  onConfirm,
  onBack,
}: PromptsStepProps) {
  const [selectedPrompts, setSelectedPrompts] =
    useState<GeneratedPrompt[]>(prompts);

  const togglePrompt = (promptId: string) => {
    setSelectedPrompts((prev) =>
      prev.map((p) => (p.id === promptId ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleConfirm = () => {
    const selected = selectedPrompts.filter((p) => p.selected);
    if (selected.length > 0) {
      onConfirm(selected);
    }
  };

  const selectedCount = selectedPrompts.filter((p) => p.selected).length;

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Generated AI Search Queries</CardTitle>
          <CardDescription>
            We've generated {prompts.length} potential search queries that users
            might use to find your content. Select the ones you want to analyze.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {selectedPrompts.map((prompt) => (
              <div
                key={prompt.id}
                onClick={() => togglePrompt(prompt.id)}
                className={`
                  p-4 rounded-lg border cursor-pointer transition-all
                  ${
                    prompt.selected
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {prompt.selected ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{prompt.prompt}</p>
                    <Badge variant="secondary" className="mt-2">
                      {prompt.category}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <div className="text-sm text-gray-600">
              {selectedCount} queries selected
            </div>

            <Button onClick={handleConfirm} disabled={selectedCount === 0}>
              Analyze Selected
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
