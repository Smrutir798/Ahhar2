const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const tableRoutes = require('./routes/tableRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const menuRoutes = require('./routes/menuRoutes');
const customerRoutes = require('./routes/customerRoutes');
const kitchenRoutes = require('./routes/kitchenRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const billRoutes = require('./routes/billRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const reportRoutes = require('./routes/reportRoutes');
const http = require('http');
const socket = require('./socket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const io = socket.init(server);
io.on('connection', (client) => {
  console.log('Client connected:', client.id);
  
  client.on('join-restaurant', (restaurantId) => {
    client.join(restaurantId);
    console.log(`Client ${client.id} joined restaurant ${restaurantId}`);
  });
  
  client.on('join-session', (sessionId) => {
    client.join(sessionId);
    console.log(`Client ${client.id} joined session ${sessionId}`);
  });
});

// Middleware
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit
  skip: (req) => req.method === 'OPTIONS', // Do not rate limit CORS preflight requests
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

app.use(
  cors({
    origin: [
      "https://ahhar2.vercel.app",
      "http://localhost:5173"
    ],
    credentials: true
  })
);
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_db')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/reports', reportRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  } else {
    console.error(`[Error] ${err.message}`);
  }
  
  const status = err.statusCode || 500;
  res.status(status).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
