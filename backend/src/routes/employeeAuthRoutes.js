const express = require('express');
const EmployeeAuthController = require('../controllers/auth/EmployeeAuthController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * Public Routes
 */

/**
 * @route POST /api/employee-auth/login
 * @description Login as employee with employee ID and password
 * @access Public
 * @body {string} employee_id - Employee ID (e.g., EMP001)
 * @body {string} password - Employee password
 */
router.post('/login', EmployeeAuthController.login);

/**
 * @route POST /api/employee-auth/verify
 * @description Verify if a token is valid
 * @access Public
 * @headers {string} authorization - Bearer token
 */
router.post('/verify', EmployeeAuthController.verifyToken);

/**
 * Protected Routes (require authentication)
 */

/**
 * @route GET /api/employee-auth/profile
 * @description Get current employee's profile
 * @access Private
 * @headers {string} authorization - Bearer token
 */
router.get('/profile', authMiddleware, EmployeeAuthController.getProfile);

/**
 * @route PUT /api/employee-auth/profile
 * @description Update current employee's profile
 * @access Private
 * @headers {string} authorization - Bearer token
 * @body {string} phone - Employee phone (optional)
 * @body {string} address - Employee address (optional)
 */
router.put('/profile', authMiddleware, EmployeeAuthController.updateProfile);

/**
 * @route PUT /api/employee-auth/change-password
 * @description Change employee's password
 * @access Private
 * @headers {string} authorization - Bearer token
 * @body {string} oldPassword - Current password
 * @body {string} newPassword - New password
 */
router.put('/change-password', authMiddleware, EmployeeAuthController.changePassword);

/**
 * @route POST /api/employee-auth/logout
 * @description Logout employee (client removes token)
 * @access Private
 * @headers {string} authorization - Bearer token
 */
router.post('/logout', authMiddleware, EmployeeAuthController.logout);

/**
 * ADMIN ONLY ROUTES
 */

/**
 * @route POST /api/employee-auth/generate-password
 * @description Generate a new password for an employee (Admin only)
 * @access Private (Admin)
 * @headers {string} authorization - Bearer token
 * @body {number} employee_id - Database employee ID
 */
router.post('/generate-password', authMiddleware, EmployeeAuthController.generatePassword);

module.exports = router;
