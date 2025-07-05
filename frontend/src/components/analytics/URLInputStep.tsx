"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Globe, ArrowRight } from "lucide-react";

interface URLInputStepProps {
  onSubmit: (url: string) => void;
}

export default function URLInputStep({ onSubmit }: URLInputStepProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic URL validation
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    try {
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
      onSubmit(urlObj.href);
    } catch {
      setError("Please enter a valid URL");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Globe className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Analyze Your Website</CardTitle>
          <CardDescription>
            Enter your website URL to discover how AI search engines see your
            content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError("");
                }}
                className={error ? "border-red-500" : ""}
              />
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            </div>
            <Button type="submit" className="w-full" size="lg">
              Start Analysis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              We'll analyze your website and generate relevant AI search queries
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
