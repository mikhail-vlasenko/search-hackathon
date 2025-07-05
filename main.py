import google.generativeai as genai
import json
import re
import os
from typing import List, Dict, Any
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

def extract_web_searches(response_text: str) -> List[str]:
    """Extract web search queries from Gemini response text."""
    searches = []
    
    # Look for various patterns that indicate web searches
    patterns = [
        r'search(?:ing)?\s+(?:for|the web for)?\s*["\']([^"\']+)["\']',
        r'web search[:\s]+["\']([^"\']+)["\']',
        r'searching[:\s]+["\']([^"\']+)["\']',
        r'query[:\s]+["\']([^"\']+)["\']',
        r'look(?:ing)?\s+up[:\s]+["\']([^"\']+)["\']',
        r'find(?:ing)?\s+information\s+(?:about|on)[:\s]+["\']([^"\']+)["\']',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, response_text, re.IGNORECASE)
        searches.extend(matches)
    
    # Also look for tool calls if they exist in the response
    tool_call_pattern = r'tool_calls?["\']?\s*:\s*\[.*?["\']([^"\']+)["\'].*?\]'
    tool_matches = re.findall(tool_call_pattern, response_text, re.IGNORECASE | re.DOTALL)
    searches.extend(tool_matches)
    
    # Clean and deduplicate
    searches = [s.strip() for s in searches if s.strip()]
    searches = list(dict.fromkeys(searches))  # Remove duplicates while preserving order
    
    return searches

def call_gemini_model(model_name: str, prompt: str, api_key: str) -> Dict[str, Any]:
    """Call a specific Gemini model with the given prompt."""
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)
        
        # Configure to enable web searches if available
        generation_config = {
            'temperature': 0.7,
            'top_p': 0.9,
            'top_k': 40,
            'max_output_tokens': 2048,
        }
        
        response = model.generate_content(
            prompt,
            generation_config=generation_config
        )
        
        return {
            'model': model_name,
            'response_text': response.text,
            'web_searches': extract_web_searches(response.text),
            'success': True
        }
        
    except Exception as e:
        return {
            'model': model_name,
            'response_text': '',
            'web_searches': [],
            'success': False,
            'error': str(e)
        }

def run_gemini_experiments(prompt: str, api_key: str = None, runs_per_model: int = 10) -> Dict[str, List[Dict[str, Any]]]:
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
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            raise ValueError("API key must be provided or set in GOOGLE_API_KEY environment variable")
    
    # Available Gemini models
    models = [
        'gemini-2.0-flash-exp',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.0-pro'
    ]
    
    results = {}
    
    for model_name in models:
        print(f"Running experiments with {model_name}...")
        model_results = []
        
        # Use ThreadPoolExecutor for parallel execution
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = []
            
            for run_num in range(runs_per_model):
                future = executor.submit(call_gemini_model, model_name, prompt, api_key)
                futures.append((future, run_num))
            
            for future, run_num in futures:
                try:
                    result = future.result(timeout=30)
                    result['run_number'] = run_num + 1
                    model_results.append(result)
                    
                    if result['success']:
                        print(f"  Run {run_num + 1}: Found {len(result['web_searches'])} web searches")
                    else:
                        print(f"  Run {run_num + 1}: Failed - {result.get('error', 'Unknown error')}")
                        
                except Exception as e:
                    print(f"  Run {run_num + 1}: Timeout or error - {str(e)}")
                    model_results.append({
                        'model': model_name,
                        'run_number': run_num + 1,
                        'response_text': '',
                        'web_searches': [],
                        'success': False,
                        'error': str(e)
                    })
        
        results[model_name] = model_results
        time.sleep(1)  # Brief pause between models
    
    return results

def summarize_results(results: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
    """Summarize the experiment results."""
    summary = {}
    
    for model_name, model_results in results.items():
        successful_runs = [r for r in model_results if r['success']]
        all_searches = []
        
        for result in successful_runs:
            all_searches.extend(result['web_searches'])
        
        unique_searches = list(dict.fromkeys(all_searches))
        
        summary[model_name] = {
            'total_runs': len(model_results),
            'successful_runs': len(successful_runs),
            'success_rate': len(successful_runs) / len(model_results) if model_results else 0,
            'total_web_searches': len(all_searches),
            'unique_web_searches': len(unique_searches),
            'web_search_queries': unique_searches
        }
    
    return summary

def main():
    """Example usage of the Gemini experiment function."""
    # Example prompt
    prompt = "What are the best AI companies to invest in right now? Please research current market leaders and emerging companies."
    
    try:
        # Run experiments
        results = run_gemini_experiments(prompt)
        
        # Summarize results
        summary = summarize_results(results)
        
        # Print results
        print("\n" + "="*60)
        print("EXPERIMENT RESULTS SUMMARY")
        print("="*60)
        
        for model_name, stats in summary.items():
            print(f"\n{model_name}:")
            print(f"  Success Rate: {stats['success_rate']:.1%} ({stats['successful_runs']}/{stats['total_runs']})")
            print(f"  Total Web Searches: {stats['total_web_searches']}")
            print(f"  Unique Web Searches: {stats['unique_web_searches']}")
            
            if stats['web_search_queries']:
                print(f"  Sample Queries:")
                for i, query in enumerate(stats['web_search_queries'][:5], 1):
                    print(f"    {i}. {query}")
                if len(stats['web_search_queries']) > 5:
                    print(f"    ... and {len(stats['web_search_queries']) - 5} more")
        
        # Save detailed results to JSON
        with open('gemini_experiment_results.json', 'w') as f:
            json.dump({
                'prompt': prompt,
                'results': results,
                'summary': summary
            }, f, indent=2)
        
        print(f"\nDetailed results saved to gemini_experiment_results.json")
        
    except Exception as e:
        print(f"Error running experiments: {e}")

if __name__ == "__main__":
    main()