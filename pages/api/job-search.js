// File: pages/api/job-search.js
import axios from 'axios';

// Environment variables should be configured in .env.local
// NEXT_PUBLIC_VAPI_API_KEY=...
// MUSE_API_KEY=...
// HYPERBOLIC_API_KEY=...

// used to clean unnecessary parts from the muse api
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
    console.log(museResponse)
    
    // Check if job listings were found
    if (!museResponse.data.results || museResponse.data.results.length === 0) {
      return res.status(404).json({ error: 'No jobs found matching the criteria' });
    }

    // Prepare system prompt for the LLM to format the job listings
    const systemPrompt = `
    You are a job summarizer. Given raw job listing JSON objects from The Muse API, your task is to extract only the most relevant and digestible details for job seekers. Focus only on:
    - Job title
    - Company name
    - Location (mention if remote)
    - Experience level
    - One short line summarizing what the company is about (if relevant)
    - One short sentence about the role’s key responsibilities or tech stack
    - Any standout perks or benefits, (ONLY IF MENTIONED)

    Avoid copying full job descriptions or boilerplate text. Do NOT include job IDs, publication dates, or unnecessary fluff. Use clear, professional, human-like tone – like you're giving a friend a quick, helpful summary of the role. Keep each job summary to 3–4 concise sentences. Do not use bullet points, greetings, or closing remarks.
    You are a voice assistant helping a user find jobs. Format the following job listings as short, spoken-friendly sentences. For each job, include only the job title, company, experience level, location, and one notable benefit. Use compact and natural language. Do not include bullet points, headers, or extra commentary.

    `;


    // Send the job listings to Hyperbolic's LLM for formatting
    // const hyperbolicResponse = await axios.post(
    //   'https://api.hyperbolic.xyz/v1/chat/completions',
    //   {
    //     model: 'meta-llama/Llama-3.3-70B-Instruct',
    //     messages: [
    //       { role: 'system', content: systemPrompt },
    //       { 
    //         role: 'user', 
    //         content: `Format these job listings in a conversational way: ${JSON.stringify(museResponse.data.results.slice(0, 5))}` 
    //       }
    //     ],
    //     temperature: 0.2,
    //     max_tokens: 100
    //   },
    //   {
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${process.env.HYPERBOLIC_API_KEY}`
    //     }
    //   }
    // );

    const cleanJobs = pruneMuseJobs(museResponse.data.results)
    // Extract the formatted response from the LLM
    // const formattedResponse = hyperbolicResponse.data.choices[0].message.content;

    // Return the formatted job listings to Vapi
    // return res.status(200).json({ response: formattedResponse });
    return res.status(200).json(museResponse.data);

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