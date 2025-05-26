// app/utils/handlers/marketInsight.js
export async function marketInsightHandler(parameters) {
  try {
    const { q, gl = 'us', num = 10 } = parameters;

    if (!q) {
      throw new Error('Search query is required');
    }

    const url = 'https://google.serper.dev/search';
    
    const requestBody = {
      q: q,
      gl: gl,
      num: num
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Format the search results for better readability
    const formattedResults = {
      search_metadata: {
        query: q,
        country: gl,
        total_results: data.searchInformation?.totalResults || 'Unknown',
        search_time: data.searchInformation?.searchTime || 'Unknown'
      },
      organic_results: data.organic?.map(result => ({
        title: result.title,
        link: result.link,
        snippet: result.snippet,
        displayed_link: result.displayedLink,
        position: result.position
      })) || [],
      knowledge_graph: data.knowledgeGraph ? {
        title: data.knowledgeGraph.title,
        type: data.knowledgeGraph.type,
        description: data.knowledgeGraph.description,
        website: data.knowledgeGraph.website,
        attributes: data.knowledgeGraph.attributes
      } : null,
      people_also_ask: data.peopleAlsoAsk?.map(question => ({
        question: question.question,
        snippet: question.snippet,
        link: question.link
      })) || [],
      related_searches: data.relatedSearches?.map(search => search.query) || [],
      news_results: data.news?.slice(0, 3).map(news => ({
        title: news.title,
        link: news.link,
        snippet: news.snippet,
        date: news.date,
        source: news.source
      })) || []
    };

    // Create a summary of insights
    const insights = [];
    
    if (formattedResults.organic_results.length > 0) {
      insights.push(`Found ${formattedResults.organic_results.length} relevant search results`);
    }
    
    if (formattedResults.knowledge_graph) {
      insights.push(`Knowledge graph available: ${formattedResults.knowledge_graph.title}`);
    }
    
    if (formattedResults.people_also_ask.length > 0) {
      insights.push(`${formattedResults.people_also_ask.length} related questions found`);
    }
    
    if (formattedResults.news_results.length > 0) {
      insights.push(`${formattedResults.news_results.length} recent news articles found`);
    }

    const summaryMessage = insights.length > 0 ? 
      `Market insights for "${q}": ${insights.join(', ')}` :
      `Search completed for "${q}" but limited results found`;

    return {
      success: true,
      data: formattedResults,
      insights: insights,
      message: summaryMessage
    };

  } catch (error) {
    console.error('Market Insight Handler Error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}