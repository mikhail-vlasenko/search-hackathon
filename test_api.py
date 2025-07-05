import requests
import json
import time

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
        custom_domain = "https://surfer.com"
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
                
                # Show recommendations
                recommendations = data.get('recommendations', [])
                if recommendations:
                    print(f"\n💡 Top Recommendations:")
                    for rec in recommendations[:3]:  # Show top 3
                        print(f"   • {rec}")
        else:
            print(f"❌ Analysis failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    """Run API tests"""
    print("🚀 Starting API Tests")
    print("Please make sure the API server is running (python api.py)")
    
    try:
        # Wait a moment for user to read
        time.sleep(2)
        
        test_custom_domain()
            
        print("\n" + "=" * 50)
        print("✅ API Tests Completed!")
        print("=" * 50)
        
    except KeyboardInterrupt:
        print("\n\n⏹️  Tests interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")

if __name__ == "__main__":
    main() 