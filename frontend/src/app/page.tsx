"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import URLInputStep from "@/components/analytics/URLInputStep";

export default function Home() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const router = useRouter();

  const handleUrlSubmit = (url: string) => {
    setIsTransitioning(true);

    // Add a slight delay for the fade effect
    setTimeout(() => {
      router.push(`/analytics?url=${encodeURIComponent(url)}`);
    }, 300);
  };

  return (
    <div
      className={`min-h-screen bg-gray-50 transition-opacity duration-300 ${
        isTransitioning ? "opacity-0" : "opacity-100"
      }`}
    >
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <URLInputStep onSubmit={handleUrlSubmit} />
      </main>
    </div>
  );
}
