const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());

app.get('/weather', async (req, res) => {
  const apiKey = '4b82c9f291e9483490162102240412'; 
  const city = req.query.city || 'London'; 
  const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&aqi=no`;

  try {
    const response = await axios.get(url);
    res.json(response.data); 
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on https://friendly-bienenstitch-d03f3d.netlify.app/`);
});
