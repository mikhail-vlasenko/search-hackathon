"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  ArrowLeft,
  Globe,
} from "lucide-react";
import { GeneratedPrompt } from "@/lib/types";

interface PromptsStepProps {
  prompts: GeneratedPrompt[];
  onConfirm: (selectedPrompts: GeneratedPrompt[]) => void;
  onBack: () => void;
  logoUrl?: string;
  domain?: string;
}

export default function PromptsStep({
  prompts,
  onConfirm,
  onBack,
  logoUrl,
  domain,
}: PromptsStepProps) {
  const [selectedPrompts, setSelectedPrompts] =
    useState<GeneratedPrompt[]>(prompts);
  const [logoStep, setLogoStep] = useState(0); // 0: Clearbit, 1: favicon, 2: fallback

  let logoSrc = undefined;
  if (logoStep === 0 && logoUrl) {
    logoSrc = logoUrl;
  } else if (logoStep === 1 && domain) {
    logoSrc = `https://${domain}/favicon.ico`;
  }

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
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-start pt-0">
      {logoStep < 2 && logoSrc ? (
        <img
          src={logoSrc}
          alt="Website logo"
          className="w-16 h-16 rounded-full mb-2 object-contain bg-white"
          onError={() => setLogoStep(logoStep + 1)}
        />
      ) : (
        <div className="w-16 h-16 rounded-full mb-2 flex items-center justify-center bg-white">
          <Globe className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <h2 className="text-3xl md:text-4xl font-light text-black mb-1 text-center">
        AI Search Prompts for {domain || "your website"}
      </h2>
      <p className="mb-4 text-lg text-gray-600 text-center max-w-2xl">
        We've generated {prompts.length} potential search queries that users
        might use to find your content. Select the ones you want to analyze.
      </p>
      <div className="w-full space-y-3 mb-16">
        {selectedPrompts.map((prompt, idx) => (
          <div
            key={prompt.id}
            onClick={() => togglePrompt(prompt.id)}
            className={`
              p-4 rounded-xl cursor-pointer transition-all flex items-center gap-3 bg-white/80
              ${prompt.selected ? "border-2 border-[#E6E7EB]" : "border-none"}
              opacity-0 translate-y-4 animate-fadeInPrompt
            `}
            style={{
              animationDelay: `${idx * 120}ms`,
              animationFillMode: "forwards",
            }}
          >
            <div className="mt-0.5">
              {prompt.selected ? (
                <CheckCircle2 className="w-5 h-5 text-black" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="flex-1 flex items-center gap-3">
              <p className="font-semibold text-black mb-0">{prompt.prompt}</p>
              <Badge variant="secondary" className="ml-2 whitespace-nowrap">
                {prompt.category}
              </Badge>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between w-full gap-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={selectedCount === 0}
          className="flex-1 bg-black text-white hover:bg-gray-900"
        >
          Analyze Selected
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
