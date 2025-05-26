// app/utils/handlers/jobDetails.js
export async function jobDetailsHandler(parameters) {
  try {
    const { job_id } = parameters;

    if (!job_id) {
      throw new Error('Job ID is required');
    }

    const url = new URL('https://jsearch.p.rapidapi.com/job-details');
    url.searchParams.append('job_id', job_id);

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
      throw new Error('Job not found');
    }

    const job = data.data[0];

    // Format the job details response
    const formattedJob = {
      id: job.job_id,
      title: job.job_title,
      company: {
        name: job.employer_name,
        website: job.employer_website,
        company_type: job.employer_company_type,
        logo: job.employer_logo
      },
      location: {
        city: job.job_city,
        state: job.job_state,
        country: job.job_country,
        is_remote: job.job_is_remote,
        full_location: job.job_city ? `${job.job_city}, ${job.job_state || job.job_country}` : job.job_country
      },
      employment_details: {
        type: job.job_employment_type,
        posted_date: job.job_posted_at_datetime_utc,
        expires_date: job.job_offer_expiration_datetime_utc,
        experience_level: job.job_required_experience?.required_experience_in_months ? 
          `${Math.round(job.job_required_experience.required_experience_in_months / 12)} years` : 
          'Not specified'
      },
      salary: {
        currency: job.job_salary_currency,
        min: job.job_min_salary,
        max: job.job_max_salary,
        period: job.job_salary_period,
        formatted: job.job_salary_currency && job.job_min_salary ? 
          `${job.job_salary_currency} ${job.job_min_salary.toLocaleString()}${job.job_max_salary ? ` - ${job.job_max_salary.toLocaleString()}` : ''} ${job.job_salary_period || ''}` : 
          'Not specified'
      },
      description: job.job_description,
      requirements: {
        education: job.job_required_education?.postgraduate_degree ? 'Postgraduate' :
                  job.job_required_education?.professional_certification ? 'Professional Certification' :
                  job.job_required_education?.high_school ? 'High School' : 'Not specified',
        skills: job.job_required_skills || [],
        experience: job.job_required_experience
      },
      benefits: job.job_benefits || [],
      application: {
        apply_link: job.job_apply_link,
        apply_is_direct: job.job_apply_is_direct,
        publisher: job.job_publisher
      }
    };

    return {
      success: true,
      data: formattedJob,
      message: `Retrieved details for job: ${job.job_title} at ${job.employer_name}`
    };

  } catch (error) {
    console.error('Job Details Handler Error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}