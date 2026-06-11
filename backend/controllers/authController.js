const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });

    await newUser.save();

    // Create an empty restaurant profile for the owner
    const newRestaurant = new Restaurant({
      ownerId: newUser._id,
      name: `${name}'s Restaurant`
    });
    await newRestaurant.save();

    const token = jwt.sign({ id: newUser._id, role: newUser.role, restaurantId: newRestaurant._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1d' });

    res.status(201).json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, restaurantId: newRestaurant._id } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    let restaurantId = user.restaurantId;
    if (!restaurantId && (user.role === 'admin' || user.role === 'owner')) {
      const restaurant = await Restaurant.findOne({ ownerId: user._id });
      if (restaurant) restaurantId = restaurant._id;
    }

    const token = jwt.sign({ id: user._id, role: user.role, restaurantId }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1d' });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, restaurantId } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
