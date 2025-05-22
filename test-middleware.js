// File: test-api-route.js
const axios = require('axios');
require('dotenv').config();

async function testApiRoute() {
  try {
    // Start your Next.js development server first with: npm run dev
    // This assumes your Next.js server is running on port 3000
    const response = await axios.post('http://localhost:3000/api/job-search', {
      category: 'Software Engineering',
      level: 'Senior',
      location: 'New York',
      company: ''
    });
    
    console.log('API Response:', response.data);
  } catch (error) {
    console.error('Error testing API route:', error.message);
    if (error.response) {
      console.error('Response error data:', error.response.data);
    }
  }
}

testApiRoute();