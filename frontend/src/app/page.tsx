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
      className={`min-h-screen w-full flex items-center justify-center transition-opacity duration-300 relative overflow-hidden ${
        isTransitioning ? "opacity-0" : "opacity-100"
      }`}
      style={{
        backgroundImage: "url('/group-2.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <main className="w-full flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-3xl md:text-4xl font-light text-gray-400 mb-2 text-center">
          Your AI Search-ability
        </h2>
        <h1 className="text-4xl md:text-5xl font-bold text-black mb-8 text-center">
          Analyze your AI visibility right now
        </h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const url = (e.target as any).elements.url.value;
            handleUrlSubmit(url);
          }}
          className="flex flex-col md:flex-row items-center gap-4"
        >
          <input
            type="text"
            name="url"
            placeholder="www.yourcompany.com"
            className="px-6 py-3 rounded-xl border border-gray-300 text-lg focus:outline-none focus:ring-2 focus:ring-black bg-white shadow-sm min-w-[260px]"
            autoComplete="off"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-black text-white text-lg font-medium hover:bg-gray-900 transition-colors shadow-sm"
          >
            Analyze
          </button>
        </form>
      </main>
    </div>
  );
}
