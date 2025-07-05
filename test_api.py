import requests
import json
import time
from pprint import pprint

# API Configuration
API_BASE_URL = "http://localhost:8000"


def test_custom_domain():
    """Test with a custom domain"""
    print("\n" + "=" * 50)
    print("🔍 Testing Custom Domain Analysis")
    print("=" * 50)
    
    # Allow user to specify a domain
    custom_domain = input("\n📝 Enter a domain to analyze (or press Enter for default): ").strip()
    
    if not custom_domain:
        custom_domain = "decathlon.de"
        print(f"Using default domain: {custom_domain}")
    
    analysis_request = {
        "prompts": ["Custom analysis request"],
        "target_domain": custom_domain
    }
    
    try:
        print(f"\n🔍 Analyzing {custom_domain}...")
        response = requests.post(
            f"{API_BASE_URL}/analyze",
            json=analysis_request,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Custom analysis successful!")
            
            # Show key metrics
            if result.get('data'):
                data = result['data']
                domain_stats = data.get('domain_detailed_stats', {})
                
                print(f"\n📊 Results for {custom_domain}:")
                print(f"   • Appears in {domain_stats.get('total_appearances', 0)} queries")
                print(f"   • Retrieval Rate: {domain_stats.get('retrieval_rate', 0):.2%}")
                print(f"   • Usage Rate: {domain_stats.get('usage_rate', 0):.2%}")
                
                # Show frequency information
                query_frequency_stats = data.get('query_frequency_stats', {})
                if query_frequency_stats:
                    print(f"\n📈 Query Frequency Information:")
                    print(f"   • Total Queries: {query_frequency_stats.get('total_queries', 0)}")
                    print(f"   • Unique Queries: {query_frequency_stats.get('unique_queries', 0)}")
                    
                    # Show most common queries
                    most_common = query_frequency_stats.get('most_common_queries', [])
                    if most_common:
                        print(f"   • Most Common Queries:")
                        for i, (query, frequency) in enumerate(most_common[:3], 1):
                            print(f"     {i}. '{query}' (appears in {frequency} prompts)")
                    
                    # Show detailed frequency breakdown
                    query_details = query_frequency_stats.get('query_details', {})
                    if query_details:
                        print(f"   • Query Frequency Breakdown:")
                        for query, stats in list(query_details.items())[:5]:  # Show first 5
                            print(f"     - '{query}': frequency={stats.get('frequency', 0)}, unique_prompts={stats.get('unique_prompts', 0)}")
                        
                        if len(query_details) > 5:
                            print(f"     ... and {len(query_details) - 5} more queries")
                
                # Show recommendations
                recommendations = data.get('recommendations', [])
                if recommendations:
                    print(f"\n💡 Top Recommendations:")
                    for rec in recommendations[:3]:  # Show top 3
                        print(f"   • {rec}")
                
                # Show Gemini analysis
                gemini_analysis = data.get('gemini_analysis', {})
                if gemini_analysis:
                    print(f"\n🤖 Gemini AI Analysis:")
                    print(f"   • Has Poor Performance: {gemini_analysis.get('has_poor_performance', False)}")
                    print(f"   • Poor Performance Cases: {gemini_analysis.get('total_poor_performance_cases', 0)}")
                    
                    if gemini_analysis.get('error'):
                        print(f"   • Error: {gemini_analysis['error']}")
                    elif gemini_analysis.get('note'):
                        print(f"   • Note: {gemini_analysis['note']}")
                    else:
                        poor_performance = gemini_analysis.get('poor_performance_analysis', {})
                        if poor_performance:
                            print(f"   • Detailed analysis available for {len(poor_performance)} queries")
                            # Show first analysis as example
                            for prompt, analysis in list(poor_performance.items())[:1]:
                                print(f"   • Sample Analysis: {analysis.get('gemini_analysis', 'No analysis available')[:100]}...")
                
                # Show API metadata
                metadata = result.get('metadata', {})
                if metadata:
                    print(f"\n📊 API Metadata:")
                    print(f"   • Has Gemini API Key: {metadata.get('has_gemini_api', False)}")
                    print(f"   • Has Response Chunks: {metadata.get('has_response_chunks', False)}")
                    
        else:
            print(f"❌ Analysis failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    test_custom_domain()


if __name__ == "__main__":
    main() 