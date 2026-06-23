const axios = require('axios');
const { computeFallbackScore } = require('../utils/featureExtractor');

const predictAuthenticity = async (features) => {
  try {
    const response = await axios.post(
      `${process.env.ML_SERVICE_URL}/predict`,
      features,
      { timeout: 8000 }
    );
    return response.data;
  } catch (error) {
    console.warn('⚠️  ML service unavailable, using fallback scoring...');
    return computeFallbackScore(features);
  }
};

module.exports = { predictAuthenticity };
