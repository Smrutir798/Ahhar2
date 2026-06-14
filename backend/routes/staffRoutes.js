const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const authMiddleware = require('../middleware/auth');

// Middleware to restrict access to admins/owners
const restrictToAdminOrOwner = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Access denied. Authorized managers only.' });
  }
  next();
};

// All staff endpoints are protected and restricted to owner/admin
router.use(authMiddleware);
router.use(restrictToAdminOrOwner);

router.get('/', staffController.getStaff);
router.post('/', staffController.createStaff);
router.delete('/:id', staffController.deleteStaff);

module.exports = router;
