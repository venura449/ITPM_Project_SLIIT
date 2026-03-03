const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const employeeAuthRoutes = require('./routes/employeeAuthRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const trainingRoutes = require('./routes/trainingRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ITPM Backend API' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Employee authentication routes
app.use('/api/employee-auth', employeeAuthRoutes);

// Employee routes
app.use('/api/employees', employeeRoutes);

// Training routes
app.use('/api/training', trainingRoutes);

// Attendance routes
app.use('/api/attendance', attendanceRoutes);

// Leave routes
app.use('/api/leave', leaveRoutes);

// Settings routes
app.use('/api/settings', settingsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

module.exports = app;
