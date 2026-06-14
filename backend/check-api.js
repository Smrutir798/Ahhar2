const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const axios = require('axios');

dotenv.config({ path: './.env' });

async function checkApi() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: /smrut/i });
  const token = jwt.sign(
    { id: user._id, role: user.role, restaurantId: '6a2a617165e84a69d7793fb8' },
    process.env.JWT_SECRET || 'secret_key',
    { expiresIn: '1d' }
  );

  try {
    const res1 = await axios.get('http://localhost:5000/api/analytics/executive', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Executive:', res1.data);
    
    const res2 = await axios.get('http://localhost:5000/api/analytics/profit', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Profit:', res2.data);
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
  }
  mongoose.disconnect();
}

checkApi();
