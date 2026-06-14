const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Bill = require('./models/Bill');
const Restaurant = require('./models/Restaurant');
const User = require('./models/User');

dotenv.config({ path: './.env' });

async function checkData() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const users = await User.find({ email: /smrut/i });
  console.log('Users found:', users.length);
  for (const user of users) {
    console.log(`User: ${user.email}, Role: ${user.role}, ID: ${user._id}`);
    const restaurants = await Restaurant.find({ ownerId: user._id });
    console.log(`  Restaurants owned by user: ${restaurants.length}`);
    for (const rest of restaurants) {
      console.log(`    Restaurant: ${rest.name}, ID: ${rest._id}`);
      const bills = await Bill.countDocuments({ restaurantId: rest._id });
      console.log(`      Bills: ${bills}`);
    }
  }

  mongoose.disconnect();
}

checkData();
