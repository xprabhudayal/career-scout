import axios from 'axios';

// Clean unnecessary parts from the muse api response
function pruneMuseJobs(rawJobs) {
  return rawJobs.map(job => ({
    title: job.name,
    company: job.company?.name || '',
    locations: job.locations?.map(loc => loc.name) || [],
    levels: job.levels?.map(level => level.name) || [],
    categories: job.categories?.map(cat => cat.name) || [],
    publication_date: job.publication_date,
    short_name: job.short_name
  }));
}

export async function POST(request) {
  try {
    // Extract search parameters from the request body
    const body = await request.json();
    const { category, level, location, company } = body;

    console.log('Received job search request:', body);

    // Validate required parameters
    if (!category) {
      return Response.json({ error: 'Job category is required' }, { status: 400 });
    }

    // Build query parameters for The Muse API
    const queryParams = new URLSearchParams();
    
    // Add parameters to the query if they exist
    if (category) queryParams.append('category', category);
    if (level) queryParams.append('level', level);
    if (location) queryParams.append('location', location);
    if (company) queryParams.append('company', company);
    
    // Add page size parameter to limit results
    queryParams.append('page', '1');
    queryParams.append('page_size', '20');

    console.log('Querying Muse API with params:', queryParams.toString());

    // Fetch job listings from The Muse API
    const museResponse = await axios.get(
      `https://www.themuse.com/api/public/jobs?${queryParams.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
          // Note: The Muse API is public and doesn't require an API key
          // Remove the Authorization header if you don't have a key
          ...(process.env.MUSE_API_KEY && { 'Authorization': `Bearer ${process.env.MUSE_API_KEY}` })
        },
        timeout: 10000 // 10 second timeout
      }
    );

    console.log('Muse API response status:', museResponse.status);
    console.log('Jobs found:', museResponse.data.results?.length || 0);

    // Check if job listings were found
    if (!museResponse.data.results || museResponse.data.results.length === 0) {
      return Response.json({ 
        error: 'No jobs found matching the criteria',
        searchParams: body 
      }, { status: 404 });
    }

    // Clean the job data
    const cleanJobs = pruneMuseJobs(museResponse.data.results);
    
    return Response.json({
      response: cleanJobs
    });

  } catch (error) {
    console.error('Error processing job search request:', error);

    // Handle different types of errors
    if (error.response) {
      console.error('API response error:', error.response.status, error.response.data);
      return Response.json({
        error: 'Error from external API',
        details: error.response.data,
        status: error.response.status
      }, { status: error.response.status });
    } else if (error.request) {
      console.error('No response received:', error.message);
      return Response.json({ 
        error: 'No response from external API',
        message: error.message 
      }, { status: 503 });
    } else {
      console.error('Request setup error:', error.message);
      return Response.json({ 
        error: 'Internal server error', 
        message: error.message 
      }, { status: 500 });
    }
  }
}