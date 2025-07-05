import { NextRequest, NextResponse } from "next/server";
import { GeneratedPrompt } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock prompt generation based on URL
    const mockPrompts: GeneratedPrompt[] = [
      {
        id: "1",
        prompt: "What are the best AI SEO companies in Germany right now?",
        queries: [
          "best AI SEO companies Germany 2024",
          "top AI SEO agencies Germany",
          "leading AI SEO service providers Germany",
        ],
        category: "Integration",
        selected: true,
      },
      {
        id: "2",
        prompt: "How to optimize website content for AI search engines?",
        queries: [
          "AI search engine optimization techniques",
          "content optimization for AI crawlers",
          "SEO strategies for AI-powered search",
        ],
        category: "SEO",
        selected: true,
      },
      {
        id: "3",
        prompt: "What are the most effective AI-powered SEO tools?",
        queries: [
          "best AI SEO tools 2024",
          "AI-powered SEO software comparison",
          "top AI SEO platforms for businesses",
        ],
        category: "Tools",
        selected: true,
      },
      {
        id: "4",
        prompt: "How to implement semantic search on my website?",
        queries: [
          "semantic search implementation guide",
          "AI semantic search for websites",
          "how to add semantic search functionality",
        ],
        category: "Implementation",
        selected: true,
      },
      {
        id: "5",
        prompt: "Best practices for AI search analytics and monitoring?",
        queries: [
          "AI search analytics best practices",
          "monitoring AI search performance",
          "AI search tracking tools",
        ],
        category: "Analytics",
        selected: true,
      },
    ];

    return NextResponse.json({ prompts: mockPrompts });
  } catch (error) {
    console.error("Error generating prompts:", error);
    return NextResponse.json(
      { error: "Failed to generate prompts" },
      { status: 500 }
    );
  }
}
