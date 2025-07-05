from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from analytics import (
    load_and_process_experiment_results, 
    load_multiple_experiment_files,
    SearchAnalytics,
    analyze_experiment_results
)

app = FastAPI(
    title="Search Analytics API",
    description="API for analyzing search performance and domain citations in AI-powered search results",
    version="1.0.0"
)

class AnalysisRequest(BaseModel):
    prompts: List[str] = []  # Ignored for now as mentioned
    target_domain: str
    experiment_files: Optional[List[str]] = None  # Optional list of experiment files to analyze

class AnalysisResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

@app.get("/")
async def root():
    return {
        "message": "Search Analytics API",
        "version": "1.0.0",
        "endpoints": {
            "analyze": "POST /analyze - Analyze domain performance",
            "health": "GET /health - Health check"
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "search-analytics-api"}

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_domain_performance(request: AnalysisRequest):
    """
    Analyze domain performance in search results
    
    Args:
        request: Contains target_domain and optionally experiment_files
        
    Returns:
        Comprehensive analysis results including:
        - Domain statistics (retrieval rate, usage rate, citation rank)
        - Query analysis
        - Performance insights
        - Recommendations
    """
    try:
        # Determine which experiment files to use
        if request.experiment_files:
            # Use provided experiment files
            experiment_files = request.experiment_files
            # Validate that files exist
            for file_path in experiment_files:
                if not os.path.exists(file_path):
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Experiment file not found: {file_path}"
                    )
        else:
            # Use default experiment file
            default_file = "gemini_experiment_results.json"
            if not os.path.exists(default_file):
                raise HTTPException(
                    status_code=404,
                    detail=f"Default experiment file not found: {default_file}. Either provide experiment_files or ensure {default_file} exists."
                )
            experiment_files = [default_file]
        
        # Load and process experiment data
        if len(experiment_files) == 1:
            search_data, response_chunks = load_and_process_experiment_results(experiment_files[0])
        else:
            search_data, response_chunks = load_multiple_experiment_files(experiment_files)
        
        if not search_data:
            raise HTTPException(
                status_code=400,
                detail="No valid search data found in the experiment files"
            )
        
        # Initialize analytics
        analytics = SearchAnalytics(search_data, response_chunks)
        
        # Generate comprehensive report
        report = analytics.generate_comprehensive_report(request.target_domain)
        
        # Add additional analysis specific to the domain
        domain_stats = analytics.calculate_domain_stats(request.target_domain)
        intersecting_queries = analytics.analyze_intersecting_queries()
        
        # Prepare metadata
        metadata = {
            "target_domain": request.target_domain,
            "experiment_files": experiment_files,
            "total_prompts_analyzed": len(search_data),
            "has_gemini_api": bool(os.getenv('GEMINI_API_KEY')),
            "analysis_timestamp": None  # Could add timestamp if needed
        }
        
        # Enhanced response with additional insights
        enhanced_report = {
            **report,
            "domain_detailed_stats": domain_stats,
            "intersecting_queries": intersecting_queries,
            "recommendations": generate_recommendations(domain_stats, report),
            "competitive_insights": generate_competitive_insights(analytics, request.target_domain)
        }
        
        return AnalysisResponse(
            success=True,
            data=enhanced_report,
            metadata=metadata
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during analysis: {str(e)}"
        )

def generate_recommendations(domain_stats: Dict[str, Any], report: Dict[str, Any]) -> List[str]:
    """Generate actionable recommendations based on analysis results"""
    recommendations = []
    
    # Retrieval rate recommendations
    if domain_stats.get('retrieval_rate', 0) < 0.5:
        recommendations.append("Low retrieval rate: Consider improving SEO and content relevance to appear in more search results")
    
    # Usage rate recommendations  
    if domain_stats.get('usage_rate', 0) < 0.7:
        recommendations.append("Low usage rate: Focus on improving content quality and authority to increase citation likelihood")
    
    # Citation rank recommendations
    avg_rank = domain_stats.get('avg_citation_rank', 0)
    if avg_rank > 3:
        recommendations.append("High average citation rank: Optimize content for better positioning in search results")
    elif avg_rank < 2:
        recommendations.append("Excellent citation positioning: Maintain current content quality and SEO strategy")
    
    # Query frequency recommendations
    query_stats = report.get('query_frequency_stats', {})
    if query_stats.get('unique_queries', 0) < 5:
        recommendations.append("Limited query diversity: Consider expanding content to cover more search topics")
    
    return recommendations

def generate_competitive_insights(analytics: SearchAnalytics, target_domain: str) -> Dict[str, Any]:
    """Generate competitive insights"""
    insights = {
        "market_position": "unknown",
        "key_competitors": [],
        "competitive_advantages": [],
        "improvement_areas": []
    }
    
    try:
        # Analyze competitive landscape
        domain_stats = analytics.calculate_domain_stats(target_domain)
        
        # Determine market position
        retrieval_rate = domain_stats.get('retrieval_rate', 0)
        usage_rate = domain_stats.get('usage_rate', 0)
        avg_rank = domain_stats.get('avg_citation_rank', float('inf'))
        
        if retrieval_rate > 0.8 and usage_rate > 0.8 and avg_rank < 2:
            insights["market_position"] = "market_leader"
        elif retrieval_rate > 0.6 and usage_rate > 0.6 and avg_rank < 3:
            insights["market_position"] = "strong_competitor"
        elif retrieval_rate > 0.4 and usage_rate > 0.4:
            insights["market_position"] = "moderate_presence"
        else:
            insights["market_position"] = "emerging_player"
        
        # Identify key competitors (domains that appear frequently)
        competitor_frequency = {}
        for prompt, queries in analytics.data.items():
            for query, domains in queries.items():
                for domain in domains.keys():
                    if domain != target_domain:
                        competitor_frequency[domain] = competitor_frequency.get(domain, 0) + 1
        
        # Get top competitors
        top_competitors = sorted(competitor_frequency.items(), key=lambda x: x[1], reverse=True)[:5]
        insights["key_competitors"] = [{"domain": domain, "frequency": freq} for domain, freq in top_competitors]
        
        # Generate competitive advantages and improvement areas
        if avg_rank < 2.5:
            insights["competitive_advantages"].append("Strong citation positioning")
        if usage_rate > 0.7:
            insights["competitive_advantages"].append("High citation conversion rate")
        if retrieval_rate > 0.7:
            insights["competitive_advantages"].append("Broad search visibility")
        
        if avg_rank > 3:
            insights["improvement_areas"].append("Citation ranking optimization needed")
        if usage_rate < 0.5:
            insights["improvement_areas"].append("Content authority enhancement required")
        if retrieval_rate < 0.5:
            insights["improvement_areas"].append("Search visibility expansion needed")
            
    except Exception as e:
        insights["error"] = f"Could not generate competitive insights: {str(e)}"
    
    return insights

@app.get("/experiment-files")
async def list_experiment_files():
    """List available experiment files in the current directory"""
    try:
        files = []
        for file in os.listdir('.'):
            if file.endswith('.json') and 'experiment' in file.lower():
                files.append({
                    "filename": file,
                    "path": file,
                    "size": os.path.getsize(file)
                })
        
        return {
            "available_files": files,
            "default_file": "gemini_experiment_results.json",
            "default_exists": os.path.exists("gemini_experiment_results.json")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing files: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 