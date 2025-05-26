// // File: test-api-route.js
// const axios = require('axios');
// require('dotenv').config();

// async function testApiRoute() {
//   try {
//     // Start your Next.js development server first with: npm run dev
//     // This assumes your Next.js server is running on port 3000
//     const response = await axios.post('http://localhost:3000/api/job-search', {
//       category: 'Software Engineering',
//       level: 'Senior',
//       location: 'New York',
//       company: ''
//     });
    
//     console.log('API Response:', response.data);
//   } catch (error) {
//     console.error('Error testing API route:', error.message);
//     if (error.response) {
//       console.error('Response error data:', error.response.data);
//     }
//   }
// }

// testApiRoute();
const axios = require('axios');

const options = {
  method: 'GET',
  url: 'https://jsearch.p.rapidapi.com/search',
  params: {
    query: 'developer jobs in chicago',
    page: '1',
    num_pages: '1',
    country: 'us',
    date_posted: 'all'
  },
  headers: {
    'x-rapidapi-key': '10d7505033msha6af41aa6addff6p15c799jsn107705d3c2fd',
    'x-rapidapi-host': 'jsearch.p.rapidapi.com'
  }
};

async function fetchData() {
	try {
		const response = await axios.request(options);
		console.log(response.data);
	} catch (error) {
		console.error(error);
	}
}

fetchData();