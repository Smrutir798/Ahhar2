const Restaurant = require('../models/Restaurant');

exports.getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ 
      $or: [{ ownerId: req.user.id }, { _id: req.user.restaurantId }] 
    });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateRestaurant = async (req, res) => {
  try {
    const { name, address, phone, gstNumber, logo } = req.body;
    let restaurant = await Restaurant.findOne({ ownerId: req.user.id });

    if (!restaurant) {
      restaurant = new Restaurant({
        ownerId: req.user.id,
        name, address, phone, gstNumber, logo
      });
      await restaurant.save();
    } else {
      restaurant.name = name !== undefined ? name : restaurant.name;
      restaurant.address = address !== undefined ? address : restaurant.address;
      restaurant.phone = phone !== undefined ? phone : restaurant.phone;
      restaurant.gstNumber = gstNumber !== undefined ? gstNumber : restaurant.gstNumber;
      restaurant.logo = logo !== undefined ? logo : restaurant.logo;
      await restaurant.save();
    }
    res.json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getAllRestaurants = async (req, res) => {
  try {
    if (req.user.role !== 'thinkdifferent') {
      return res.status(403).json({ message: 'Access denied. ThinkDifferent Members only.' });
    }
    const restaurants = await Restaurant.find().populate('ownerId', 'name email');
    res.json(restaurants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createNewRestaurantByThinkDifferent = async (req, res) => {
  try {
    if (req.user.role !== 'thinkdifferent') {
      return res.status(403).json({ message: 'Access denied. ThinkDifferent Members only.' });
    }

    const { restaurantName, address, phone, gstNumber, ownerName, ownerEmail, ownerPassword } = req.body;

    const existingUser = await User.findOne({ email: ownerEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ownerPassword, salt);

    const newOwner = new User({
      name: ownerName,
      email: ownerEmail,
      password: hashedPassword,
      role: 'owner'
    });
    await newOwner.save();

    const newRestaurant = new Restaurant({
      ownerId: newOwner._id,
      name: restaurantName,
      address,
      phone,
      gstNumber
    });
    await newRestaurant.save();

    newOwner.restaurantId = newRestaurant._id;
    await newOwner.save();

    res.status(201).json({
      message: 'Restaurant and Owner account created successfully',
      restaurant: newRestaurant,
      owner: {
        id: newOwner._id,
        name: newOwner.name,
        email: newOwner.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
