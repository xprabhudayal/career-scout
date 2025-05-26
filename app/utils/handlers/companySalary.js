// app/utils/handlers/companySalary.js
export async function companySalaryHandler(parameters) {
  try {
    const { company, job_title, location_type = 'city', years_of_experience } = parameters;

    if (!company || !job_title) {
      throw new Error('Company and job title are required');
    }

    const url = new URL('https://jsearch.p.rapidapi.com/company-job-salary');
    url.searchParams.append('company', company);
    url.searchParams.append('job_title', job_title);
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
      throw new Error(`No salary data found for ${job_title} at ${company}`);
    }

    // Format multiple salary entries if available
    const formattedSalaries = data.data.map(salaryData => ({
      company: salaryData.company_name || company,
      job_title: salaryData.job_title || job_title,
      location: salaryData.location,
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
    }));

    // Create summary statistics if multiple entries
    const summary = formattedSalaries.length > 1 ? {
      total_entries: formattedSalaries.length,
      salary_ranges: formattedSalaries
        .filter(s => s.salary_range.min && s.salary_range.max)
        .map(s => ({ min: s.salary_range.min, max: s.salary_range.max })),
      average_range: null // Could calculate if needed
    } : null;

    const primarySalary = formattedSalaries[0];
    const summaryMessage = primarySalary.salary_range.min && primarySalary.salary_range.max ?
      `Salary for ${job_title} at ${company}: ${primarySalary.salary_range.formatted.range} ${primarySalary.salary_period}` :
      `Found salary data for ${job_title} at ${company}, but specific range not available`;

    return {
      success: true,
      data: {
        primary_result: primarySalary,
        all_results: formattedSalaries,
        summary: summary,
        search_criteria: {
          company: company,
          job_title: job_title,
          location_type: location_type,
          years_of_experience: years_of_experience
        }
      },
      message: summaryMessage
    };

  } catch (error) {
    console.error('Company Salary Handler Error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}