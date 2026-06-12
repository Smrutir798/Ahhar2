const MenuItem = require('../models/MenuItem');

exports.getMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ ownerId: req.user.id }).populate('categoryId', 'name');
    res.json(menuItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createMenuItem = async (req, res) => {
  try {
    const { name, description, price, image, categoryId, available } = req.body;
    const newMenuItem = new MenuItem({
      ownerId: req.user.id,
      name,
      description,
      price,
      image,
      categoryId,
      available
    });
    await newMenuItem.save();
    
    // populate category for the response
    await newMenuItem.populate('categoryId', 'name');
    
    res.status(201).json(newMenuItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const { name, description, price, image, categoryId, available } = req.body;
    let menuItem = await MenuItem.findOne({ _id: req.params.id, ownerId: req.user.id });

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    menuItem.name = name !== undefined ? name : menuItem.name;
    menuItem.description = description !== undefined ? description : menuItem.description;
    menuItem.price = price !== undefined ? price : menuItem.price;
    menuItem.image = image !== undefined ? image : menuItem.image;
    menuItem.categoryId = categoryId !== undefined ? categoryId : menuItem.categoryId;
    menuItem.available = available !== undefined ? available : menuItem.available;
    
    await menuItem.save();
    await menuItem.populate('categoryId', 'name');
    
    res.json(menuItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
