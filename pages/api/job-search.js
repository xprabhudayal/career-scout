// File: pages/api/job-search.js
import axios from 'axios';

// used to clean unnecessary parts from the muse api, ie long description about the company
function pruneMuseJobs(rawJobs) {
  return rawJobs.map(job => ({
    title: job.name,
    company: job.company?.name || '',
    locations: job.locations.map(loc => loc.name) || [],
    levels: job.levels.map(level => level.name) || [],
    categories: job.categories.map(cat => cat.name) || []
  }));
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract search parameters from the request body sent by Vapi
    const { category, level, location, company } = req.body;

    // Validate required parameters
    if (!category) {
      return res.status(400).json({ error: 'Job category is required' });
    }

    // Build query parameters for The Muse API
    const queryParams = new URLSearchParams();
    
    // Add parameters to the query if they exist
    if (category) queryParams.append('category', category);
    if (level) queryParams.append('level', level);
    if (location) queryParams.append('location', location);
    if (company) queryParams.append('company', company);
    
    // Add page size parameter to limit results
    queryParams.append('page', 1);
    queryParams.append('page_size', 20); // Adjust as needed

    // Fetch job listings from The Muse API
    const museResponse = await axios.get(
      `https://www.themuse.com/api/public/jobs?${queryParams.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MUSE_API_KEY}`
        }
      }
    );

    
    // Check if job listings were found
    if (!museResponse.data.results || museResponse.data.results.length === 0) {
      return res.status(404).json({ error: 'No jobs found matching the criteria' });
    }

    // remove the big content from api call
    const cleanJobs = pruneMuseJobs(museResponse.data.results)

    // this below one is normal api response
    // return res.status(200).json(museResponse.data);

    // this one is without the content
    return res.status(200).json({response : cleanJobs});


  } catch (error) {
    console.error('Error processing job search request:', error);
    
    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API response error:', error.response.data);
      return res.status(error.response.status).json({ 
        error: 'Error from external API', 
        details: error.response.data 
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      return res.status(503).json({ error: 'No response from external API' });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
      return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }
}