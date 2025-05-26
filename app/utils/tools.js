// app/utils/tools.js
export const tools = [
  {
    id: "search-jobs",
    type: "function",
    function: {
      name: "search-jobs",
      description: "Search for jobs based on keywords, location, and filters",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Job search query (e.g., 'developer jobs in Chicago')"
          },
          page: {
            type: "number",
            description: "Page number for pagination (default: 1)",
            default: 1
          },
          num_pages: {
            type: "number",
            description: "Number of pages to retrieve (default: 1)",
            default: 1
          },
          country: {
            type: "string",
            description: "Country code (e.g., 'us', 'uk', 'ca')",
            default: "us"
          },
          date_posted: {
            type: "string",
            description: "Filter by date posted (all, today, 3days, week, month)",
            enum: ["all", "today", "3days", "week", "month"],
            default: "all"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    id: "job-details",
    type: "function",
    function: {
      name: "job-details",
      description: "Get detailed information about a specific job posting",
      parameters: {
        type: "object",
        properties: {
          job_id: {
            type: "string",
            description: "The unique job ID from job search results"
          }
        },
        required: ["job_id"]
      }
    }
  },
  {
    id: "estimated-salary",
    type: "function",
    function: {
      name: "estimated-salary",
      description: "Get estimated salary range for a job title and location",
      parameters: {
        type: "object",
        properties: {
          job_title: {
            type: "string",
            description: "Job title (e.g., 'Software Engineer', 'Data Scientist')"
          },
          location: {
            type: "string",
            description: "Location (e.g., 'New York, NY', 'San Francisco, CA')"
          },
          location_type: {
            type: "string",
            description: "Type of location",
            enum: ["city", "state", "country"],
            default: "city"
          },
          years_of_experience: {
            type: "number",
            description: "Years of experience (0-20+)",
            minimum: 0,
            maximum: 20
          }
        },
        required: ["job_title", "location"]
      }
    }
  },
  {
    id: "company-job-salary",
    type: "function",
    function: {
      name: "company-job-salary",
      description: "Get salary information for a specific role at a company",
      parameters: {
        type: "object",
        properties: {
          company: {
            type: "string",
            description: "Company name (e.g., 'Google', 'Microsoft')"
          },
          job_title: {
            type: "string",
            description: "Job title at the company"
          },
          location_type: {
            type: "string",
            description: "Type of location",
            enum: ["city", "state", "country"],
            default: "city"
          },
          years_of_experience: {
            type: "number",
            description: "Years of experience (0-20+)",
            minimum: 0,
            maximum: 20
          }
        },
        required: ["company", "job_title"]
      }
    }
  },
  {
    id: "market-insight-tool",
    type: "function",
    function: {
      name: "market-insight-tool",
      description: "Search for market insights and industry trends using web search",
      parameters: {
        type: "object",
        properties: {
          q: {
            type: "string",
            description: "Search query for market insights (e.g., 'remote hiring trends for designers')"
          },
          gl: {
            type: "string",
            description: "Country code for search results (e.g., 'us', 'uk')",
            default: "us"
          },
          num: {
            type: "number",
            description: "Number of search results to return",
            default: 10,
            minimum: 1,
            maximum: 100
          }
        },
        required: ["q"]
      }
    }
  }
];