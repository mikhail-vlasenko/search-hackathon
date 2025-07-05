import { NextRequest, NextResponse } from "next/server";
import { GeneratedPrompt } from "@/lib/types";
import { CheerioCrawler } from "@crawlee/cheerio";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    console.log(`Starting content extraction for: ${url}`);

    // Step 1: Crawl the website using Crawlee
    let extractedContent = "";
    let pageTitle = "";
    let pageDescription = "";

    try {
      const crawler = new CheerioCrawler({
        // Respect robots.txt and rate limiting
        maxRequestsPerCrawl: 1,
        requestHandlerTimeoutSecs: 30,
        preNavigationHooks: [
          async ({ request }) => {
            // Set headers before the request
            request.headers = {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
              Accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.5",
              "Accept-Encoding": "gzip, deflate",
              Connection: "keep-alive",
              "Upgrade-Insecure-Requests": "1",
            };
          },
        ],
        async requestHandler({ $, request, body }) {
          console.log(`Successfully crawled: ${request.url}`);

          // Extract basic page info
          pageTitle = $("title").text().trim() || "";
          pageDescription = $('meta[name="description"]').attr("content") || "";

          // Step 2: Use Mozilla Readability to extract main content
          try {
            // Create a JSDOM instance from the raw HTML
            const dom = new JSDOM(body, {
              url: request.url,
            });

            // Use Readability to extract the main content
            const reader = new Readability(dom.window.document, {
              keepClasses: false,
              classesToPreserve: [],
            });

            const article = reader.parse();

            if (article && article.textContent) {
              extractedContent = article.textContent.trim();
              console.log(
                `Extracted ${extractedContent.length} characters of content`
              );
            } else {
              // Fallback: use Cheerio to extract text content
              console.log("Readability failed, using fallback text extraction");
              extractedContent = $("body").text().replace(/\s+/g, " ").trim();
            }
          } catch (readabilityError) {
            console.warn("Readability extraction failed:", readabilityError);
            // Fallback: use Cheerio to extract text content
            extractedContent = $("body").text().replace(/\s+/g, " ").trim();
          }
        },
      });

      // Run the crawler
      await crawler.run([url]);
    } catch (crawlError) {
      console.error("Crawling failed:", crawlError);
      return NextResponse.json(
        {
          error:
            "Failed to crawl the website. The site may be blocking requests or may not be accessible.",
        },
        { status: 500 }
      );
    }

    if (!extractedContent) {
      return NextResponse.json(
        { error: "No content could be extracted from the website" },
        { status: 400 }
      );
    }

    // Truncate content if too long (OpenAI has token limits)
    const maxContentLength = 8000; // Conservative limit to stay within token bounds
    const truncatedContent =
      extractedContent.length > maxContentLength
        ? extractedContent.substring(0, maxContentLength) + "..."
        : extractedContent;

    console.log(
      `Sending ${truncatedContent.length} characters to OpenAI for analysis`
    );

    // Step 3: Use OpenAI to generate realistic AI search queries
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert in understanding how users interact with AI-powered search tools like ChatGPT, Claude, Perplexity, Bing Chat, and Google Bard. 

AI search tools differ from traditional search engines in several key ways:
1. Users ask natural language questions instead of using keywords
2. Users seek comprehensive, conversational answers rather than links
3. Users often ask for comparisons, explanations, and actionable advice
4. Users typically want current, authoritative information
5. Queries tend to be more specific and context-rich
6. Users often ask follow-up questions in a conversational manner

Your task is to analyze the provided website content and generate 5-8 realistic queries that potential customers might ask AI search tools when looking for information related to this business/website.

Focus on:
- What services/products this business offers
- What problems they solve
- What industry they're in
- What makes them unique or valuable
- What questions their target audience would ask

Generate queries that sound natural and conversational, as if someone was actually talking to an AI assistant.`,
          },
          {
            role: "user",
            content: `Please analyze this website content and generate 5-8 realistic AI search queries that potential customers might use to find businesses like this:

Website: ${url}
Title: ${pageTitle}
Description: ${pageDescription}

Content:
${truncatedContent}

Return the response as a JSON object with this exact structure:
{
  "prompts": [
    {
      "id": "1",
      "prompt": "the actual query text",
      "category": "category name",
      "queries": ["related query variation 1", "related query variation 2", "related query variation 3"]
    }
  ]
}

Categories should be logical groupings like: "Services", "Solutions", "Comparison", "Implementation", "Pricing", "Industry", "Best Practices", etc.

Make sure each prompt sounds like a natural question someone would ask an AI assistant, not keyword searches.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const responseContent = completion.choices[0]?.message?.content;

      if (!responseContent) {
        throw new Error("No response from OpenAI");
      }

      console.log("Raw OpenAI response:", responseContent);

      // Parse the JSON response
      let parsedResponse;
      try {
        // Try to extract JSON from the response (in case it's wrapped in text)
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : responseContent;
        parsedResponse = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("Failed to parse OpenAI response as JSON:", parseError);
        throw new Error("Invalid JSON response from OpenAI");
      }

      if (!parsedResponse.prompts || !Array.isArray(parsedResponse.prompts)) {
        throw new Error("Invalid response structure from OpenAI");
      }

      // Process and validate the generated prompts
      const generatedPrompts: GeneratedPrompt[] = parsedResponse.prompts.map(
        (prompt: any, index: number) => ({
          id: (index + 1).toString(),
          prompt: prompt.prompt || "",
          category: prompt.category || "General",
          selected: true,
          queries: Array.isArray(prompt.queries) ? prompt.queries : [],
        })
      );

      console.log(`Generated ${generatedPrompts.length} prompts`);

      return NextResponse.json({ prompts: generatedPrompts });
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError);
      return NextResponse.json(
        {
          error:
            "Failed to generate prompts using AI. Please check your OpenAI API key and try again.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in generate-prompts:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while generating prompts" },
      { status: 500 }
    );
  }
}
