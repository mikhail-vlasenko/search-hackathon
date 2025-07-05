from google import genai
from google.genai import types
from google.api_core.client_options import ClientOptions

# from google.cloud import discoveryengine_v1 as discoveryengine
import warnings
import json
import re
import os
from typing import List, Dict, Any
import time
import random
from concurrent.futures import ThreadPoolExecutor, as_completed
from googlesearch import search
from urllib.parse import urlparse
import traceback as tb
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
            # print(f"Loaded {url}")
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
                    print(f"\t\tFound {url}")
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
        # Add randomized delay to avoid rate limiting
        delay = random.uniform(1, 5)
        print(f"Adding {delay:.2f}s delay after error")
        time.sleep(delay)
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
        if chunks is None:
            warnings.warn(f"Ultra bad, {response.candidates[0].contents}")

        # Extract all domains from chunk titles
        chunk_domains = []
        chunk_uri = []
        for chunk in chunks:
            domain = get_domain_from_title(chunk.web.title)
            chunk_uri.append(decode_uri(chunk.web.uri))
            chunk_domains.append(domain)

        # Build citation indices for each chunk
        chunk_citations = {}  # chunk_index -> list of citation indices
        chunk_contents = {}

        # Sort supports by start index to get citation order
        sorted_supports = sorted(supports, key=lambda s: s.segment.start_index)

        for citation_idx, support in enumerate(sorted_supports, 1):
            if support.grounding_chunk_indices:
                for chunk_idx in support.grounding_chunk_indices:
                    if chunk_idx < len(chunks):
                        if chunk_idx not in chunk_citations:
                            chunk_citations[chunk_idx] = []
                            chunk_contents[chunk_idx] = []
                        chunk_citations[chunk_idx].append(citation_idx)
                        chunk_contents[chunk_idx].append(support.segment.text)

        # Now attribute domains to queries by searching (parallelized)
        result = {}

        # Use ThreadPoolExecutor to parallelize Google searches
        with ThreadPoolExecutor(max_workers=min(len(all_queries), 10)) as executor:
            # Submit all search tasks
            future_to_query = {
                executor.submit(
                    search_and_match_domains, query, chunk_domains, chunk_uri
                ): query
                for query in all_queries
            }

            # Collect results as they complete
            for future in as_completed(future_to_query):
                query = future_to_query[future]
                # print(f"Searching for: {query}")

                try:
                    url_to_url = future.result()
                    query_results = {}

                    # For each chunk, check if we found a matching URL
                    for chunk_idx, chunk in enumerate(chunks):
                        domain = chunk_domains[chunk_idx]
                        url = chunk_uri[chunk_idx]
                        grounding_uri = chunk_uri[chunk_idx]
                        # print(f"The grounding uri is {grounding_uri}")
                        citations = chunk_citations.get(chunk_idx, [])
                        contents = chunk_contents.get(chunk_idx, [])
                        refs = {"citations": citations, "contents": contents}

                        if url in url_to_url:
                            # Found a matching URL from Google search
                            url = url_to_url[url]
                            query_results[url] = refs
                        else:
                            # No matching URL found, use a placeholder
                            continue
                            query_results[url] = refs

                    result[query] = query_results

                except Exception as e:
                    print(f"Error searching for query '{query}': {e}")
                    # Add randomized delay to avoid rate limiting
                    delay = random.uniform(1, 5)
                    print(f"Adding {delay:.2f}s delay before next request")
                    time.sleep(delay)
                    result[query] = {}

        return result

    except Exception as e:
        print(f"Error extracting searches and citations: {tb.format_exception(e)}")
        return {}


def call_google_search_model(
    prompt: str, project_id: str, location: str, engine_id: str
) -> Dict[str, Any]:
    """Call Google Search model using Discovery Engine to extract summaries."""
    try:
        client_options = (
            ClientOptions(api_endpoint=f"{location}-discoveryengine.googleapis.com")
            if location != "global"
            else None
        )

        client = discoveryengine.ConversationalSearchServiceClient(
            client_options=client_options
        )

        serving_config = f"projects/{project_id}/locations/{location}/collections/default_collection/engines/{engine_id}/servingConfigs/default_serving_config"

        query_understanding_spec = discoveryengine.AnswerQueryRequest.QueryUnderstandingSpec(
            query_rephraser_spec=discoveryengine.AnswerQueryRequest.QueryUnderstandingSpec.QueryRephraserSpec(
                disable=False,
                max_rephrase_steps=1,
            ),
            query_classification_spec=discoveryengine.AnswerQueryRequest.QueryUnderstandingSpec.QueryClassificationSpec(
                types=[
                    discoveryengine.AnswerQueryRequest.QueryUnderstandingSpec.QueryClassificationSpec.Type.ADVERSARIAL_QUERY,
                    discoveryengine.AnswerQueryRequest.QueryUnderstandingSpec.QueryClassificationSpec.Type.NON_ANSWER_SEEKING_QUERY,
                ]
            ),
        )

        answer_generation_spec = discoveryengine.AnswerQueryRequest.AnswerGenerationSpec(
            ignore_adversarial_query=False,
            ignore_non_answer_seeking_query=False,
            ignore_low_relevant_content=False,
            model_spec=discoveryengine.AnswerQueryRequest.AnswerGenerationSpec.ModelSpec(
                model_version="gemini-2.0-flash-001/answer_gen/v1",
            ),
            prompt_spec=discoveryengine.AnswerQueryRequest.AnswerGenerationSpec.PromptSpec(
                preamble="Give a detailed answer.",
            ),
            include_citations=True,
            answer_language_code="en",
        )

        request = discoveryengine.AnswerQueryRequest(
            serving_config=serving_config,
            query=discoveryengine.Query(text=prompt),
            session=None,
            query_understanding_spec=query_understanding_spec,
            answer_generation_spec=answer_generation_spec,
        )

        response = client.answer_query(request)

        return {
            "model": "Google Search",
            "response": response.answer.answer_text if response.answer else "",
            "web_searches": {},
            "success": True,
        }

    except Exception as e:
        return {
            "model": "Google Search",
            "response_text": "",
            "web_searches": {},
            "success": False,
            "error": str(e),
        }


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
            temperature=1.0,
            seed=random.randint(1, 10000),
            thinking_config=types.ThinkingConfig(
                thinking_budget=0
            ),  # Disable thinking for speed
        )

        response = client.models.generate_content(
            model=model_name, contents=prompt, config=config
        )
        try:
            print(
                f"Got response from the {model_name} {prompt}: {response.text[:50]}; {len(response.candidates)}"
            )
        except:
            pass

        search_citations = {}
        for i in range(5):
            try:
                search_citations = extract_searches_and_citations(response)
                break
            except Exception as e:
                warnings.warn(f"FUCK FUCK FUCK FUCK with {e}")
                pass

        return {
            "model": model_name,
            "response": response.text,
            "web_searches": search_citations,
            "success": True,
        }

    except Exception as e:
        return {
            "model": model_name,
            "response_text": "",
            "web_searches": {"citations": [], "contents": []},
            "success": False,
            "error": str(e),
        }


def run_all_gemini_models(
    prompt: str,
    api_key: str = None,
    runs_per_model: int = 2,
    project_id: str = None,
    location: str = "global",
    engine_id: str = None,
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Run experiments with multiple Gemini models and extract web tool calls.

    Args:
        prompt: The prompt to send to the models
        api_key: Google API key (if None, will try to get from environment)
        runs_per_model: Number of times to run each model (default: 10)
        project_id: Google Cloud project ID for Google Search model
        location: Google Cloud location for Google Search model
        engine_id: Discovery Engine ID for Google Search model

    Returns:
        Dictionary with model names as keys and lists of results as values
    """
    if api_key is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError(
                "API key must be provided or set in GEMINI_API_KEY environment variable"
            )

    # Available models
    models = [
        "gemini-2.5-flash",
        # "gemini-2.5-pro",
        # "gemini-1.5-pro",
        # "gemini-1.5-flash",
    ]

    # Add Google Search model if credentials are provided
    if project_id and engine_id:
        models.append("Google Search")

    results = {}

    for model_name in models:
        print(f"Running experiments with {model_name} on {prompt}...")
        model_results = []

        # Use ThreadPoolExecutor for parallel execution
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = []

            for run_num in range(runs_per_model):
                if model_name == "Google Search":
                    future = executor.submit(
                        call_google_search_model,
                        prompt,
                        project_id,
                        location,
                        engine_id,
                    )
                else:
                    future = executor.submit(
                        call_gemini_model, model_name, prompt, api_key
                    )
                futures.append((future, run_num))

            for future, run_num in futures:
                for attempt_idx in range(3):
                    try:
                        result = future.result(timeout=300)
                        result["run_number"] = run_num + 1
                        model_results.append(result)

                        print(f"{prompt}:")
                        if result["success"]:
                            print(
                                f"  Run {run_num + 1}: Found {len(result['web_searches'])} web searches"
                            )
                            break
                        else:
                            print(
                                f"  Run {run_num + 1}: Failed - {result.get('error', 'Unknown error')}"
                            )
                            print("Retrying....")

                    except Exception as e:
                        print(f"  Run {run_num + 1}: Timeout or error - {str(e)}")
                        # Add randomized delay to avoid rate limiting
                        delay = random.uniform(1, 3)
                        print(f"Adding {delay:.2f}s delay before retry")
                        time.sleep(delay)
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
                        warnings.warn(
                            f"Retrying; it was a total failure btw: {tb.format_exception(e)}"
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


def respond(prompts):
    # Google Cloud configuration for Google Search model
    project_id = None  # os.getenv("GOOGLE_CLOUD_PROJECT")
    location = "global"  # os.getenv("GOOGLE_CLOUD_LOCATION", "global")
    engine_id = None  # os.getenv("GOOGLE_CLOUD_ENGINE_ID")

    def process_prompt(prompt):
        for i in range(3):
            try:
                results = run_all_gemini_models(
                    prompt,
                    project_id=project_id,
                    location=location,
                    engine_id=engine_id,
                )

                summary = summarize_results(results)

                return {"prompt": prompt, "results": results, "summary": summary}
            except Exception as e:
                print(f"Error running experiments: {e}, retrying")
                if i == 2:
                    warnings.warn(
                        f"FUCK FUCK FUCK FUCK FUCK - stuff is breaking very badly, probably rate limiting or whatever? {tb.format_exception(e)}"
                    )
                # Add randomized delay to avoid rate limiting
                delay = random.uniform(3, 10)
                print(f"Adding {delay:.2f}s delay before retry")
                time.sleep(delay)
        return None

    all_results = []
    with ThreadPoolExecutor(max_workers=len(prompts)) as executor:
        futures = [executor.submit(process_prompt, prompt) for prompt in prompts]

        for future in as_completed(futures):
            result = future.result()
            if result:
                all_results.append(result)

    with open("internal_responce_log.json", "w") as f:
        json.dump(
            all_results,
            f,
            indent=2,
        )
    return all_results


if __name__ == "__main__":
    respond(
        [
            "cheapest bicycle to buy in berlin",
            "cycling good, where to buy cycling machine deutschalnd to ride on roads and helmet",
        ]
    )
