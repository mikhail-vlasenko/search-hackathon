import { NextRequest, NextResponse } from "next/server";
import { GeneratedPrompt } from "@/lib/types";
import { CheerioCrawler } from "@crawlee/cheerio";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cache configuration
const CACHE_DIR = path.join(process.cwd(), ".cache", "prompts");
const CACHE_EXPIRY_HOURS = 24; // Cache expires after 24 hours

// Helper function to generate cache key from URL
function generateCacheKey(url: string): string {
  return crypto.createHash("md5").update(url).digest("hex");
}

// Helper function to get cache file path
function getCacheFilePath(cacheKey: string): string {
  return path.join(CACHE_DIR, `${cacheKey}.json`);
}

// Helper function to read from cache
async function readFromCache(url: string): Promise<GeneratedPrompt[] | null> {
  try {
    const cacheKey = generateCacheKey(url);
    const cacheFilePath = getCacheFilePath(cacheKey);

    // Check if cache file exists
    const stats = await fs.stat(cacheFilePath);

    // Check if cache is expired
    const now = new Date();
    const cacheTime = new Date(stats.mtime);
    const hoursDiff = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > CACHE_EXPIRY_HOURS) {
      console.log(`Cache expired for ${url}`);
      return null;
    }

    // Read and parse cache file
    const cacheData = await fs.readFile(cacheFilePath, "utf-8");
    const cachedResult = JSON.parse(cacheData);

    console.log(`Cache hit for ${url}`);
    return cachedResult.prompts;
  } catch (error) {
    // Cache miss or error reading cache
    console.log(`Cache miss for ${url}`);
    return null;
  }
}

// Helper function to write to cache
async function writeToCache(
  url: string,
  prompts: GeneratedPrompt[]
): Promise<void> {
  try {
    const cacheKey = generateCacheKey(url);
    const cacheFilePath = getCacheFilePath(cacheKey);

    // Ensure cache directory exists
    await fs.mkdir(CACHE_DIR, { recursive: true });

    // Write cache data
    const cacheData = {
      url,
      timestamp: new Date().toISOString(),
      prompts,
    };

    await fs.writeFile(cacheFilePath, JSON.stringify(cacheData, null, 2));
    console.log(`Cached results for ${url}`);
  } catch (error) {
    console.error(`Failed to write cache for ${url}:`, error);
    // Don't throw error - caching is not critical
  }
}

export async function POST(request: NextRequest) {
  const hardcodedPrompts = [
    "cheapest bicycle to buy in berlin",
    "cycling good, where to buy cycling machine deutschalnd to ride on roads and helmet",
    "best bikes for cycling in Berlin",
    "best bikes for cycling near Berlin",
    "best bikes for cycling in Europe",
    "cycle fast; city bikes; berlin",
  ];

  const generatedPrompts: GeneratedPrompt[] = hardcodedPrompts.map(
    (prompt: string, index: number) => ({
      id: (index + 1).toString(),
      prompt: prompt,
      category: "Cycling",
      selected: true,
      queries: [prompt], // Include the prompt itself as a query variation
    })
  );
  return NextResponse.json({ prompts: generatedPrompts });

  //   try {
  //     // const { url } = await request.json();
  //     const url = "buying bikes berlin";

  //     if (!url) {
  //       return NextResponse.json({ error: "URL is required" }, { status: 400 });
  //     }

  //     // Validate URL format
  //     // try {
  //     //   new URL(url.startsWith("http") ? url : `https://${url}`);
  //     // } catch {
  //     //   return NextResponse.json(
  //     //     { error: "Invalid URL format" },
  //     //     { status: 400 }
  //     //   );
  //     // }

  //     console.log(`Starting content extraction for: ${url}`);

  //     // Check cache first
  //     const cachedPrompts = await readFromCache(url);
  //     if (cachedPrompts) {
  //       console.log(`Returning cached results for: ${url}`);
  //       return NextResponse.json({ prompts: cachedPrompts });
  //     }

  //     // Step 1: Crawl the website using Crawlee
  //     let extractedContent = "";
  //     let pageTitle = "";
  //     let pageDescription = "";
  //     let crawlSuccessful = false;

  //     try {
  //       const crawler = new CheerioCrawler({
  //         // Allow more requests for thorough crawling
  //         maxRequestsPerCrawl: 5,
  //         // requestHandlerTimeoutSecs: 60,
  //         // // Add retry logic for failed requests
  //         // maxRequestRetries: 2,
  //         // // Set concurrent requests to 1 to be respectful
  //         // maxConcurrency: 1,
  //         // // Follow redirects
  //         // ignoreSslErrors: true,
  //         // // Add additional options for better compatibility
  //         // additionalMimeTypes: ["text/html", "application/xhtml+xml"],
  //         preNavigationHooks: [
  //           async ({ request }) => {
  //             console.log(`Attempting to crawl: ${request.url}`);
  //             // Set headers before the request
  //             request.headers = {
  //               "User-Agent":
  //                 "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  //               Accept:
  //                 "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  //               "Accept-Language": "en-US,en;q=0.5",
  //               "Accept-Encoding": "gzip, deflate",
  //               Connection: "keep-alive",
  //               "Upgrade-Insecure-Requests": "1",
  //             };
  //           },
  //         ],
  //         async requestHandler({ $, request, body }) {
  //           console.log(
  //             `Successfully crawled: ${request.url} (Status: ${request.state})`
  //           );
  //           console.log(`Response body length: ${body.length}`);

  //           crawlSuccessful = true;

  //           // Extract basic page info
  //           pageTitle = $("title").text().trim() || "";
  //           pageDescription = $('meta[name="description"]').attr("content") || "";

  //           console.log(`Page title: ${pageTitle}`);
  //           console.log(`Page description: ${pageDescription}`);

  //           // Step 2: Use Mozilla Readability to extract main content
  //           try {
  //             // Create a JSDOM instance from the raw HTML
  //             const dom = new JSDOM(body, {
  //               url: request.url,
  //             });

  //             // Use Readability to extract the main content
  //             const reader = new Readability(dom.window.document, {
  //               keepClasses: false,
  //               classesToPreserve: [],
  //             });

  //             const article = reader.parse();

  //             if (article && article.textContent) {
  //               extractedContent = article.textContent.trim();
  //               console.log(
  //                 `Extracted ${extractedContent.length} characters of content using Readability`
  //               );
  //             } else {
  //               // Fallback: use Cheerio to extract text content
  //               console.log("Readability failed, using fallback text extraction");
  //               extractedContent = $("body").text().replace(/\s+/g, " ").trim();
  //               console.log(
  //                 `Extracted ${extractedContent.length} characters of content using Cheerio fallback`
  //               );
  //             }
  //           } catch (readabilityError) {
  //             console.warn("Readability extraction failed:", readabilityError);
  //             // Fallback: use Cheerio to extract text content
  //             extractedContent = $("body").text().replace(/\s+/g, " ").trim();
  //             console.log(
  //               `Extracted ${extractedContent.length} characters of content using Cheerio fallback after error`
  //             );
  //           }
  //         },
  //         async failedRequestHandler({ request, error }) {
  //           console.error(`Request failed for ${request.url}:`, error);
  //           console.error(`Error details:`, error);
  //         },
  //       });

  //       // Run the crawler
  //       console.log(`Starting crawler for URL: ${url}`);
  //       const result = await crawler.run([url]);
  //       console.log(`Crawler finished. Result:`, result);

  //       // Check if crawling was successful
  //       if (!crawlSuccessful) {
  //         console.error(
  //           "Crawler completed but no successful requests were processed"
  //         );
  //         throw new Error("No successful requests were processed by the crawler");
  //       }
  //     } catch (crawlError) {
  //       console.error("Crawling failed:", crawlError);
  //       console.error("Error details:", crawlError);

  //       // Try a simple fetch as fallback
  //       console.log("Attempting simple fetch as fallback...");
  //       try {
  //         const response = await fetch(url, {
  //           headers: {
  //             "User-Agent":
  //               "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  //             Accept:
  //               "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  //           },
  //           redirect: "follow",
  //         });

  //         if (!response.ok) {
  //           throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  //         }

  //         const html = await response.text();
  //         console.log(`Fallback fetch succeeded, got ${html.length} characters`);

  //         // Parse with JSDOM and extract content
  //         const dom = new JSDOM(html, { url });
  //         const document = dom.window.document;

  //         pageTitle = document.title || "";
  //         const metaDescription = document.querySelector(
  //           'meta[name="description"]'
  //         );
  //         pageDescription = metaDescription?.getAttribute("content") || "";

  //         // Try Readability
  //         try {
  //           const reader = new Readability(document, {
  //             keepClasses: false,
  //             classesToPreserve: [],
  //           });
  //           const article = reader.parse();

  //           if (article && article.textContent) {
  //             extractedContent = article.textContent.trim();
  //             console.log(
  //               `Fallback: Extracted ${extractedContent.length} characters using Readability`
  //             );
  //           } else {
  //             extractedContent =
  //               document.body?.textContent?.replace(/\s+/g, " ").trim() || "";
  //             console.log(
  //               `Fallback: Extracted ${extractedContent.length} characters using textContent`
  //             );
  //           }
  //         } catch (readabilityError) {
  //           console.warn("Fallback readability failed:", readabilityError);
  //           extractedContent =
  //             document.body?.textContent?.replace(/\s+/g, " ").trim() || "";
  //           console.log(
  //             `Fallback: Extracted ${extractedContent.length} characters using textContent after error`
  //           );
  //         }

  //         crawlSuccessful = true;
  //       } catch (fetchError) {
  //         console.error("Fallback fetch also failed:", fetchError);
  //         console.log(
  //           "All crawling methods failed, generating prompts based on URL only"
  //         );

  //         // Final fallback: generate prompts based on URL only
  //         crawlSuccessful = false;
  //         extractedContent = "";
  //         pageTitle = "";
  //         pageDescription = "";
  //       }
  //     }

  //     // Check if we have content or if we need to proceed with URL-only analysis
  //     const hasContent = extractedContent && extractedContent.trim().length > 0;

  //     if (!hasContent) {
  //       console.log("No content extracted, proceeding with URL-only analysis");
  //     }

  //     // Truncate content if too long (OpenAI has token limits)
  //     const maxContentLength = 8000; // Conservative limit to stay within token bounds
  //     const truncatedContent = hasContent
  //       ? extractedContent.length > maxContentLength
  //         ? extractedContent.substring(0, maxContentLength) + "..."
  //         : extractedContent
  //       : "";

  //     console.log(
  //       hasContent
  //         ? `Sending ${truncatedContent.length} characters to OpenAI for analysis`
  //         : `Generating prompts based on URL only: ${url}`
  //     );

  //     // Step 3: Use OpenAI to generate realistic AI search queries
  //     try {
  //       const completion = await openai.chat.completions.create({
  //         model: "gpt-3.5-turbo",
  //         messages: [
  //           {
  //             role: "system",
  //             content: `You are an expert in understanding how users interact with AI-powered search tools like ChatGPT, Claude, Perplexity, Bing Chat, and Google Bard.

  // AI search tools differ from traditional search engines in several key ways:
  // 1. Users ask natural language questions instead of using keywords
  // 2. Users seek comprehensive, conversational answers rather than links
  // 3. Users often ask for comparisons, explanations, and actionable advice
  // 4. Users typically want current, authoritative information
  // 5. Queries tend to be more specific and context-rich
  // 6. Users often ask follow-up questions in a conversational manner

  // Your task is to generate 5-8 realistic queries that potential customers might ask AI search tools when looking for information related to this business/website.

  // ${
  //   hasContent
  //     ? `You will be provided with website content to analyze. Focus on:
  // - What services/products this business offers
  // - What problems they solve
  // - What industry they're in
  // - What makes them unique or valuable
  // - What questions their target audience would ask`
  //     : `You will only have the website URL to work with. Based on the domain name, path, and any clues in the URL structure, make educated inferences about:
  // - What type of business this might be
  // - What industry they're likely in
  // - What services they might offer
  // - What problems they might solve
  // - What questions users might ask when looking for this type of business`
  // }

  // Generate queries that sound natural and conversational, as if someone was actually talking to an AI assistant.`,
  //           },
  //           {
  //             role: "user",
  //             content: hasContent
  //               ? `Please analyze this website content and generate 5-8 realistic AI search queries that potential customers might use to find businesses like this:

  // Website: ${url}
  // Title: ${pageTitle}
  // Description: ${pageDescription}

  // Content:
  // ${truncatedContent}

  // Return the response as a JSON object with this exact structure:
  // {
  //   "prompts": [
  //     {
  //       "id": "1",
  //       "prompt": "the actual query text",
  //       "category": "category name",
  //       "queries": ["related query variation 1", "related query variation 2", "related query variation 3"]
  //     }
  //   ]
  // }

  // Categories should be logical groupings like: "Services", "Solutions", "Comparison", "Implementation", "Pricing", "Industry", "Best Practices", etc.

  // Make sure each prompt sounds like a natural question someone would ask an AI assistant, not keyword searches.`
  //               : `Please analyze this website URL and generate 5-8 realistic AI search queries that potential customers might use to find businesses like this:

  // Website: ${url}

  // Note: Website content could not be accessed, so please base your analysis on the URL structure, domain name, and any other clues you can infer from the URL itself.

  // For example:
  // - If the URL contains "marketing" or "agency", assume it's a marketing business
  // - If it contains "restaurant" or "food", assume it's food-related
  // - If it contains "tech" or "software", assume it's technology-related
  // - Use the domain name and path to infer the business type and industry

  // Return the response as a JSON object with this exact structure:
  // {
  //   "prompts": [
  //     {
  //       "id": "1",
  //       "prompt": "the actual query text",
  //       "category": "category name",
  //       "queries": ["related query variation 1", "related query variation 2", "related query variation 3"]
  //     }
  //   ]
  // }

  // Categories should be logical groupings like: "Services", "Solutions", "Comparison", "Implementation", "Pricing", "Industry", "Best Practices", etc.

  // Make sure each prompt sounds like a natural question someone would ask an AI assistant, not keyword searches.

  // Generate relevant, realistic queries even with limited information.`,
  //           },
  //         ],
  //         temperature: 0.7,
  //         max_tokens: 2000,
  //       });

  //       const responseContent = completion.choices[0]?.message?.content;

  //       if (!responseContent) {
  //         throw new Error("No response from OpenAI");
  //       }

  //       console.log("Raw OpenAI response:", responseContent);

  //       // Parse the JSON response
  //       let parsedResponse;
  //       try {
  //         // Try to extract JSON from the response (in case it's wrapped in text)
  //         const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
  //         const jsonStr = jsonMatch ? jsonMatch[0] : responseContent;
  //         parsedResponse = JSON.parse(jsonStr);
  //       } catch (parseError) {
  //         console.error("Failed to parse OpenAI response as JSON:", parseError);
  //         throw new Error("Invalid JSON response from OpenAI");
  //       }

  //       if (!parsedResponse.prompts || !Array.isArray(parsedResponse.prompts)) {
  //         throw new Error("Invalid response structure from OpenAI");
  //       }

  //       // Process and validate the generated prompts
  //       const generatedPrompts: GeneratedPrompt[] = parsedResponse.prompts.map(
  //         (prompt: any, index: number) => ({
  //           id: (index + 1).toString(),
  //           prompt: prompt.prompt || "",
  //           category: prompt.category || "General",
  //           selected: true,
  //           queries: Array.isArray(prompt.queries) ? prompt.queries : [],
  //         })
  //       );

  //       console.log(`Generated ${generatedPrompts.length} prompts`);

  //       // Cache the generated prompts
  //       await writeToCache(url, generatedPrompts);

  //       return NextResponse.json({ prompts: generatedPrompts });
  //     } catch (openaiError) {
  //       console.error("OpenAI API error:", openaiError);
  //       return NextResponse.json(
  //         {
  //           error:
  //             "Failed to generate prompts using AI. Please check your OpenAI API key and try again.",
  //         },
  //         { status: 500 }
  //       );
  //     }
  //   } catch (error) {
  //     console.error("Unexpected error in generate-prompts:", error);
  //     return NextResponse.json(
  //       { error: "An unexpected error occurred while generating prompts" },
  //       { status: 500 }
  //     );
  //   }
}
