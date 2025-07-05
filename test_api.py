import requests
import json
import time

# API Configuration
API_BASE_URL = "http://localhost:8000"

def test_gemini_analysis():
    """Test the Gemini analysis functionality specifically"""
    print("\n" + "=" * 50)
    print("🤖 Testing Gemini Analysis Integration")
    print("=" * 50)
    
    # Test domain that likely has poor performance
    test_domain = "https://example.com"
    
    analysis_request = {
        "prompts": ["Testing Gemini analysis"],
        "target_domain": test_domain
    }
    
    try:
        print(f"\n🔍 Testing Gemini analysis for {test_domain}...")
        response = requests.post(
            f"{API_BASE_URL}/analyze",
            json=analysis_request,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API call successful!")
            
            # Focus on Gemini analysis
            if result.get('data'):
                data = result['data']
                gemini_analysis = data.get('gemini_analysis', {})
                
                print(f"\n🤖 Gemini Analysis Results:")
                print(f"   • Analysis Available: {bool(gemini_analysis)}")
                print(f"   • Has Poor Performance: {gemini_analysis.get('has_poor_performance', False)}")
                print(f"   • Poor Performance Cases: {gemini_analysis.get('total_poor_performance_cases', 0)}")
                
                if gemini_analysis.get('error'):
                    print(f"   • Error: {gemini_analysis['error']}")
                elif gemini_analysis.get('note'):
                    print(f"   • Note: {gemini_analysis['note']}")
                
                # Check metadata
                metadata = result.get('metadata', {})
                print(f"\n📊 Environment Check:")
                print(f"   • Has Gemini API Key: {metadata.get('has_gemini_api', False)}")
                print(f"   • Has Response Chunks: {metadata.get('has_response_chunks', False)}")
                
                # Check recommendations include Gemini insights
                recommendations = data.get('recommendations', [])
                gemini_recommendations = [rec for rec in recommendations if 'AI analysis' in rec or 'competitive analysis' in rec]
                if gemini_recommendations:
                    print(f"\n💡 Gemini-Enhanced Recommendations:")
                    for rec in gemini_recommendations:
                        print(f"   • {rec}")
                else:
                    print(f"\n💡 No Gemini-enhanced recommendations found")
                    
        else:
            print(f"❌ API call failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")

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
    """Run API tests"""
    print("🚀 Starting API Tests")
    print("Please make sure the API server is running (python api.py)")
    
    try:
        # Wait a moment for user to read
        time.sleep(1)
        
        # Show test menu
        print("\n📋 Available Tests:")
        print("1. Test Gemini Analysis Integration")
        print("2. Test Custom Domain Analysis")
        print("3. Run All Tests")
        
        choice = input("\nSelect test to run (1-3): ").strip()
        
        if choice == "1":
            test_gemini_analysis()
        elif choice == "2":
            test_custom_domain()
        elif choice == "3":
            test_gemini_analysis()
            test_custom_domain()
        else:
            print("Invalid choice, running all tests...")
            test_gemini_analysis()
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