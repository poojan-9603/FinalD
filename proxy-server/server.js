const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 5001;

// Enable CORS for your frontend
app.use(cors());

// Proxy endpoint to fetch weather data
app.get('/weather', async (req, res) => {
  const apiKey = '4b82c9f291e9483490162102240412'; // Replace with your actual API key
  const city = req.query.city || 'London'; // Default to London if no city is provided
  const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&aqi=no`;

  try {
    const response = await axios.get(url);
    res.json(response.data); // Send the weather data back to the frontend
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
