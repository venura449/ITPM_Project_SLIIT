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
const payrollRoutes = require('./routes/payrollRoutes');

const app = express();

// Middleware
// Comma-separated allowed origins. Set ALLOWED_ORIGINS env var on Render.
const allowedOrigins = ("http://localhost:5173,https://itpm-project-sliit.vercel.app").split(",").map(origin => origin.trim());

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Return false (not an error) so the response still sends — just without
    // the Allow-Origin header, which the browser will reject.
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Handle preflight OPTIONS requests for all routes BEFORE any other middleware
app.options("*", cors(corsOptions));

app.use(cors(corsOptions));
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

// Payroll routes
app.use('/api/payroll', payrollRoutes);

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
