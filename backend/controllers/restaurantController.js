const Restaurant = require('../models/Restaurant');

exports.getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
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
