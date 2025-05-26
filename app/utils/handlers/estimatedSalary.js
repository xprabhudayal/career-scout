// app/utils/handlers/estimatedSalary.js
export async function estimatedSalaryHandler(parameters) {
  try {
    const { job_title, location, location_type = 'city', years_of_experience } = parameters;

    if (!job_title || !location) {
      throw new Error('Job title and location are required');
    }

    const url = new URL('https://jsearch.p.rapidapi.com/estimated-salary');
    url.searchParams.append('job_title', job_title);
    url.searchParams.append('location', location);
    url.searchParams.append('location_type', location_type);
    
    if (years_of_experience !== undefined) {
      url.searchParams.append('years_of_experience', years_of_experience.toString());
    }

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

    if (!data.data || data.data.length === 0) {
      throw new Error('No salary data found for the specified criteria');
    }

    const salaryData = data.data[0];

    // Format the salary response
    const formattedSalary = {
      job_title: salaryData.job_title,
      location: {
        name: salaryData.location,
        type: location_type
      },
      experience_level: years_of_experience ? `${years_of_experience} years` : 'Not specified',
      salary_range: {
        currency: salaryData.salary_currency,
        min: salaryData.min_salary,
        max: salaryData.max_salary,
        median: salaryData.median_salary,
        formatted: {
          min: salaryData.salary_currency && salaryData.min_salary ? 
            `${salaryData.salary_currency} ${salaryData.min_salary.toLocaleString()}` : 'Not available',
          max: salaryData.salary_currency && salaryData.max_salary ? 
            `${salaryData.salary_currency} ${salaryData.max_salary.toLocaleString()}` : 'Not available',
          median: salaryData.salary_currency && salaryData.median_salary ? 
            `${salaryData.salary_currency} ${salaryData.median_salary.toLocaleString()}` : 'Not available',
          range: salaryData.salary_currency && salaryData.min_salary && salaryData.max_salary ? 
            `${salaryData.salary_currency} ${salaryData.min_salary.toLocaleString()} - ${salaryData.max_salary.toLocaleString()}` : 'Range not available'
        }
      },
      salary_period: salaryData.salary_period || 'per year',
      publisher_name: salaryData.publisher_name,
      publisher_link: salaryData.publisher_link
    };

    const summaryMessage = salaryData.salary_currency && salaryData.min_salary && salaryData.max_salary ?
      `Estimated salary for ${job_title} in ${location}: ${salaryData.salary_currency} ${salaryData.min_salary.toLocaleString()} - ${salaryData.max_salary.toLocaleString()} ${salaryData.salary_period || 'per year'}` :
      `Found salary data for ${job_title} in ${location}, but specific range not available`;

    return {
      success: true,
      data: formattedSalary,
      message: summaryMessage
    };

  } catch (error) {
    console.error('Estimated Salary Handler Error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}