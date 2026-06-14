const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, tableController.getTables);
router.get('/live-status', authMiddleware, tableController.getLiveTableStatus);
router.post('/', authMiddleware, tableController.createTable);
router.put('/:id', authMiddleware, tableController.updateTable);
router.delete('/:id', authMiddleware, tableController.deleteTable);

module.exports = router;
