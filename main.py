from google import genai
from google.genai import types
import json
import re
import os
from typing import List, Dict, Any
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from googlesearch import search
from urllib.parse import urlparse
import requests


def decode_uri(uri: str):
    """goes through the vertex link passed, and responds with the actual url"""
    if uri and uri.startswith("gs://"):
        uri = uri.replace("gs://", "https://storage.googleapis.com/", 1).replace(
            " ", "%20"
        )
    response = requests.get(uri)
    return response.url


def get_domain_from_title(title: str) -> str:
    """Extract domain from title like 'aljazeera.com' -> 'aljazeera.com'"""
    # Common patterns for domain extraction from titles
    domain_patterns = [
        r"([a-zA-Z0-9-]+\.com)",
        r"([a-zA-Z0-9-]+\.org)",
        r"([a-zA-Z0-9-]+\.net)",
        r"([a-zA-Z0-9-]+\.edu)",
        r"([a-zA-Z0-9-]+\.gov)",
        r"([a-zA-Z0-9-]+\.[a-zA-Z]{2,})",
    ]

    for pattern in domain_patterns:
        match = re.search(pattern, title, re.IGNORECASE)
        if match:
            return match.group(1).lower()

    return title.lower()


def search_and_match_domains(
    query: str, target_domains: List[str], target_uris: List[str]
) -> Dict[str, str]:
    """Search Google for query and match results to target domains"""
    try:
        # Search Google for the query
        search_results = search(query)

        domain_to_url = {}

        urls = []
        for i, url in enumerate(search_results):
            print(f"Loaded {url}")
            if i > 10:
                break
            time.sleep(0.1)
            urls.append(url)

        for url in urls:
            parsed_url = urlparse(url)
            result_domain = parsed_url.netloc.lower()

            # Match against target domains
            for turl in target_uris:
                if turl in url or url in turl:
                    domain_to_url[turl] = url
                    print(f"Found {url}")
                    break

        for url in urls:
            parsed_url = urlparse(url)
            result_domain = parsed_url.netloc.lower()

            # Match against target domains
            for target_domain, turl in zip(target_domains, target_uris):
                if turl in domain_to_url:
                    break
                if target_domain in result_domain or result_domain in target_domain:
                    domain_to_url[turl] = url
                    print(f"Found {url}")
                    break

        return domain_to_url

    except Exception as e:
        print(f"Error searching for query '{query}': {e}")
        return {}


def extract_searches_and_citations(response: Any) -> Dict[str, Dict[str, List[int]]]:
    """
    The output structure:
    {
        "best ai SEO companies": {
            "https://probably-spam.com": [1,3], # 1,3 are citation indexing ordered by the when it is cited in the response
            "https://peeq.ai": [], # something that is not found
        },
        ...
    }
    """
    try:
        grounding_metadata = response.candidates[0].grounding_metadata
        all_queries = grounding_metadata.web_search_queries
        supports = grounding_metadata.grounding_supports
        chunks = grounding_metadata.grounding_chunks

        # Extract all domains from chunk titles
        chunk_domains = []
        chunk_uri = []
        for chunk in chunks:
            domain = get_domain_from_title(chunk.web.title)
            chunk_uri.append(decode_uri(chunk.web.uri))
            chunk_domains.append(domain)

        # Build citation indices for each chunk
        chunk_citations = {}  # chunk_index -> list of citation indices

        # Sort supports by start index to get citation order
        sorted_supports = sorted(supports, key=lambda s: s.segment.start_index)

        for citation_idx, support in enumerate(sorted_supports, 1):
            if support.grounding_chunk_indices:
                for chunk_idx in support.grounding_chunk_indices:
                    if chunk_idx < len(chunks):
                        if chunk_idx not in chunk_citations:
                            chunk_citations[chunk_idx] = []
                        chunk_citations[chunk_idx].append(citation_idx)

        # Now attribute domains to queries by searching
        result = {}

        for query in all_queries:
            print(f"Searching for: {query}")

            # Search Google and match domains
            url_to_url = search_and_match_domains(query, chunk_domains, chunk_uri)

            query_results = {}

            # For each chunk, check if we found a matching URL
            for chunk_idx, chunk in enumerate(chunks):
                domain = chunk_domains[chunk_idx]
                url = chunk_uri[chunk_idx]
                grounding_uri = chunk_uri[chunk_idx]
                print(f"The grounding uri is {grounding_uri}")
                citations = chunk_citations.get(chunk_idx, [])

                if url in url_to_url:
                    # Found a matching URL from Google search
                    url = url_to_url[url]
                    query_results[url] = citations
                else:
                    # No matching URL found, use a placeholder
                    query_results[f"https://{domain}"] = citations

            result[query] = query_results

        return result

    except Exception as e:
        print(f"Error extracting searches and citations: {e}")
        return {}


def call_gemini_model(model_name: str, prompt: str, api_key: str) -> Dict[str, Any]:
    """Call a specific Gemini model with the given prompt."""
    try:
        os.environ["GEMINI_API_KEY"] = api_key
        client = genai.Client()

        grounding_tool = types.Tool(google_search=types.GoogleSearch())

        # Configure generation settings
        config = types.GenerateContentConfig(
            tools=[grounding_tool],
            max_output_tokens=2048,
            thinking_config=types.ThinkingConfig(
                thinking_budget=0
            ),  # Disable thinking for speed
        )

        response = client.models.generate_content(
            model=model_name, contents=prompt, config=config
        )

        search_citations = {}
        for i in range(5):
            try:
                search_citations = extract_searches_and_citations(response)
                break
            except Exception as e:
                print(f"FUCK FUCK FUCK FUCK with {e}")
                pass

        return {
            "model": model_name,
            "response": response.text,
            "web_searches": search_citations,
            "raw_response": response,  # Keep raw response for debugging
            "success": True,
        }

    except Exception as e:
        return {
            "model": model_name,
            "response_text": "",
            "web_searches": [],
            "success": False,
            "error": str(e),
        }


def run_all_gemini_models(
    prompt: str, api_key: str = None, runs_per_model: int = 1
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Run experiments with multiple Gemini models and extract web tool calls.

    Args:
        prompt: The prompt to send to the models
        api_key: Google API key (if None, will try to get from environment)
        runs_per_model: Number of times to run each model (default: 10)

    Returns:
        Dictionary with model names as keys and lists of results as values
    """
    if api_key is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError(
                "API key must be provided or set in GEMINI_API_KEY environment variable"
            )

    # Available Gemini models
    models = [
        "gemini-2.5-flash",
        # "gemini-2.5-pro",
        # "gemini-1.5-pro",
        # "gemini-1.5-flash",
    ]

    results = {}

    for model_name in models:
        print(f"Running experiments with {model_name}...")
        model_results = []

        # Use ThreadPoolExecutor for parallel execution
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = []

            for run_num in range(runs_per_model):
                future = executor.submit(call_gemini_model, model_name, prompt, api_key)
                futures.append((future, run_num))

            for future, run_num in futures:
                try:
                    result = future.result(timeout=60)
                    result["run_number"] = run_num + 1
                    model_results.append(result)

                    if result["success"]:
                        print(
                            f"  Run {run_num + 1}: Found {len(result['web_searches'])} web searches"
                        )
                    else:
                        print(
                            f"  Run {run_num + 1}: Failed - {result.get('error', 'Unknown error')}"
                        )

                except Exception as e:
                    print(f"  Run {run_num + 1}: Timeout or error - {str(e)}")
                    model_results.append(
                        {
                            "model": model_name,
                            "run_number": run_num + 1,
                            "response_text": "",
                            "web_searches": [],
                            "success": False,
                            "error": str(e),
                        }
                    )

        results[model_name] = model_results
        time.sleep(1)  # Brief pause between models

    return results


def summarize_results(results: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
    """Summarize the experiment results."""
    summary = {}

    for model_name, model_results in results.items():
        successful_runs = [r for r in model_results if r["success"]]
        all_searches = []

        for result in successful_runs:
            all_searches.extend(result["web_searches"])

        unique_searches = list(dict.fromkeys(all_searches))

        summary[model_name] = {
            "total_runs": len(model_results),
            "successful_runs": len(successful_runs),
            "success_rate": len(successful_runs) / len(model_results)
            if model_results
            else 0,
            "total_web_searches": len(all_searches),
            "unique_web_searches": len(unique_searches),
            "web_search_queries": unique_searches,
        }

    return summary


def main():
    """Example usage of the Gemini experiment function."""
    # Example prompt
    prompt = "What are the best AI SEO companies in Germany right now?"

    try:
        # Run experiments
        results = run_all_gemini_models(prompt)

        # Summarize results
        summary = summarize_results(results)

        # Print results
        print("\n" + "=" * 60)
        print("EXPERIMENT RESULTS SUMMARY")
        print("=" * 60)

        for model_name, stats in summary.items():
            print(f"\n{model_name}:")
            print(
                f"  Success Rate: {stats['success_rate']:.1%} ({stats['successful_runs']}/{stats['total_runs']})"
            )
            print(f"  Total Web Searches: {stats['total_web_searches']}")
            print(f"  Unique Web Searches: {stats['unique_web_searches']}")

            if stats["web_search_queries"]:
                print(f"  Sample Queries:")
                for i, query in enumerate(stats["web_search_queries"][:5], 1):
                    print(f"    {i}. {query}")
                if len(stats["web_search_queries"]) > 5:
                    print(f"    ... and {len(stats['web_search_queries']) - 5} more")

        # Save detailed results to JSON
        with open("gemini_experiment_results.json", "w") as f:
            json.dump(
                {"prompt": prompt, "results": results, "summary": summary}, f, indent=2
            )

        print(f"\nDetailed results saved to gemini_experiment_results.json")

    except Exception as e:
        print(f"Error running experiments: {e}")


if __name__ == "__main__":
    main()
