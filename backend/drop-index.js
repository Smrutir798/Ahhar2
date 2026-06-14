const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI not defined in environment');
      return;
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const User = require('./models/User');

    console.log('Current indexes in users collection:');
    const indexesBefore = await User.collection.indexes();
    console.log(indexesBefore);

    // Drop index if it exists
    const hasEmailIndex = indexesBefore.some(idx => idx.name === 'email_1');
    if (hasEmailIndex) {
      console.log('Dropping email_1 index...');
      await User.collection.dropIndex('email_1');
      console.log('Dropped email_1 index successfully!');
    } else {
      console.log('email_1 index not found, skipping drop.');
    }

    console.log('Syncing indexes with new schema...');
    await User.syncIndexes();
    console.log('Synced indexes successfully!');

    console.log('Indexes after sync:');
    const indexesAfter = await User.collection.indexes();
    console.log(indexesAfter);

  } catch (err) {
    console.error('Operation failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

run();
