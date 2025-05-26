// app/utils/handlers/searchJobs.js
export async function searchJobsHandler(parameters) {
  try {
    const { query, page = 1, num_pages = 1, country = 'us', date_posted = 'all' } = parameters;

    const url = new URL('https://jsearch.p.rapidapi.com/search');
    url.searchParams.append('query', query);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('num_pages', num_pages.toString());
    url.searchParams.append('country', country);
    url.searchParams.append('date_posted', date_posted);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.JSEARCH_API_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      throw new Error(`JSearch API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Format the response for better readability
    const formattedJobs = data.data?.map(job => ({
      id: job.job_id,
      title: job.job_title,
      company: job.employer_name,
      location: job.job_city ? `${job.job_city}, ${job.job_state || job.job_country}` : job.job_country,
      employment_type: job.job_employment_type,
      posted_date: job.job_posted_at_datetime_utc,
      salary: job.job_salary_currency && job.job_min_salary ? 
        `${job.job_salary_currency} ${job.job_min_salary.toLocaleString()}${job.job_max_salary ? ` - ${job.job_max_salary.toLocaleString()}` : ''}` : 
        'Not specified',
      apply_link: job.job_apply_link,
      description_snippet: job.job_description?.substring(0, 200) + '...' || 'No description available'
    })) || [];

    return {
      success: true,
      data: {
        total_jobs: data.status === 'OK' ? formattedJobs.length : 0,
        current_page: page,
        jobs: formattedJobs,
        query_info: {
          search_query: query,
          country: country,
          date_filter: date_posted
        }
      },
      message: `Found ${formattedJobs.length} jobs for "${query}"`
    };

  } catch (error) {
    console.error('Search Jobs Handler Error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}