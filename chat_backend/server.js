const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const sequelize = require('./models').sequelize;
const routes = require('./routes');
const app = express();
const path = require('path');
const server = http.createServer(app);

// Configure CORS
const allowedOrigins = [
  "https://hacker.bahwebdev.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173", // Add this for Vite default origin
  "http://localhost:5000", // Optional: if you need to access from the server itself
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Not allowed by CORS:', origin); // Helpful for debugging
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

// Configure CORS
app.use(cors(corsOptions));

// Socket.IO CORS configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Simply pass the array directly
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running on port 5000!' });
});

// Routes
app.use('/api', routes);

// Socket.IO Setup
require('./socket')(io);

// Start server
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected!');
    server.listen(5000, () => {
      console.log('🚀 Server running on http://localhost:5000');
    });
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err);
  });
