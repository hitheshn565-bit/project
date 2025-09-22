const axios = require('axios');

async function testRecommendations() {
    try {
        console.log('Testing Python recommendation service...');
        
        // Test direct Python service
        const pythonResponse = await axios.get('http://localhost:5001/recommendations/trending?limit=3');
        console.log('✅ Python service working:', pythonResponse.data.total, 'recommendations');
        
        // Test Node.js backend
        const backendResponse = await axios.get('http://localhost:3000/api/v1/recommendations/trending?limit=3');
        console.log('✅ Backend integration working:', backendResponse.data);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testRecommendations();
