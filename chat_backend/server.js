const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors'); // Import CORS
const sequelize = require('./models').sequelize;
const routes = require('./routes');

const app = express();
const server = http.createServer(app);

// Configure CORS
const allowedOrigins = [
  "https://hacker.bahwebdev.com",
  "http://localhost:5173",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

// Configure CORS
app.use(cors(corsOptions));
// Socket.IO CORS (updated to match Express CORS)
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(express.json());

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
