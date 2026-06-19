const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get all staff members for the restaurant
exports.getStaff = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ message: 'No restaurant associated with this user' });
    }

    // Find all users with roles in ['waiter', 'kitchen', 'cashier', 'inventory_manager'] linked to this restaurantId
    const staff = await User.find({
      restaurantId,
      role: { $in: ['waiter', 'kitchen', 'cashier', 'inventory_manager'] }
    }).select('-password').sort({ createdAt: -1 });

    res.json(staff);
  } catch (error) {
    console.error('getStaff error:', error);
    res.status(500).json({ message: 'Server error fetching staff' });
  }
};

// Create a new staff member
exports.createStaff = async (req, res) => {
  try {
    const { name, phone, password, role } = req.body;
    const restaurantId = req.user.restaurantId;

    if (!restaurantId) {
      return res.status(400).json({ message: 'No restaurant associated with this user' });
    }

    if (!['waiter', 'kitchen', 'cashier', 'inventory_manager'].includes(role)) {
      return res.status(400).json({ message: 'Invalid staff role provided' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: 'Staff member with this phone number already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create staff member
    const newStaff = new User({
      name,
      phone,
      password: hashedPassword,
      role,
      restaurantId
    });

    await newStaff.save();

    // Return the created staff without password
    const staffResponse = newStaff.toObject();
    delete staffResponse.password;

    res.status(201).json({
      message: 'Staff member enrolled successfully',
      staff: staffResponse
    });
  } catch (error) {
    console.error('createStaff error:', error);
    res.status(500).json({ message: 'Server error enrolling staff' });
  }
};

// Delete a staff member
exports.deleteStaff = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const staffId = req.params.id;

    if (!restaurantId) {
      return res.status(400).json({ message: 'No restaurant associated with this user' });
    }

    // Find and delete the staff member, ensuring they belong to this restaurant
    const staffMember = await User.findOneAndDelete({
      _id: staffId,
      restaurantId,
      role: { $in: ['waiter', 'kitchen', 'cashier', 'inventory_manager'] }
    });

    if (!staffMember) {
      return res.status(404).json({ message: 'Staff member not found or does not belong to your restaurant' });
    }

    res.json({ message: 'Staff member removed successfully' });
  } catch (error) {
    console.error('deleteStaff error:', error);
    res.status(500).json({ message: 'Server error removing staff' });
  }
};

// Reset a staff member's password
exports.resetStaffPassword = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const staffId = req.params.id;
    const { password } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ message: 'No restaurant associated with this user' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Find the staff member and update their password
    const staffMember = await User.findOneAndUpdate(
      {
        _id: staffId,
        restaurantId,
        role: { $in: ['waiter', 'kitchen', 'cashier', 'inventory_manager'] }
      },
      { password: hashedPassword },
      { new: true }
    );

    if (!staffMember) {
      return res.status(404).json({ message: 'Staff member not found or does not belong to your restaurant' });
    }

    res.json({ message: 'Staff member password updated successfully' });
  } catch (error) {
    console.error('resetStaffPassword error:', error);
    res.status(500).json({ message: 'Server error updating staff password' });
  }
};
