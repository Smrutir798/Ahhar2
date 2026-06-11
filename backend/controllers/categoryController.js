const Category = require('../models/Category');

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ ownerId: req.user.id });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const newCategory = new Category({
      ownerId: req.user.id,
      name,
      description
    });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    let category = await Category.findOne({ _id: req.params.id, ownerId: req.user.id });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    category.name = name !== undefined ? name : category.name;
    category.description = description !== undefined ? description : category.description;
    
    await category.save();
    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
