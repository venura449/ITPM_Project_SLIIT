const express = require('express');
const AttendanceController = require('../controllers/Dias/AttendanceController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get daily attendance sheet
router.get('/sheet', AttendanceController.getAttendanceSheet);

// Search employees
router.get('/search', AttendanceController.searchEmployees);

// Mark attendance
router.post('/mark', AttendanceController.markAttendance);

// Get attendance history for employee
router.get('/history/:employeeId', AttendanceController.getAttendanceHistory);

// Get monthly attendance report for an employee
router.get('/report/:employeeId', AttendanceController.getMonthlyReport);

// Get monthly attendance report for all employees
router.get('/report-all', AttendanceController.getMonthlyReportAll);

// Delete attendance record
router.delete('/:id', AttendanceController.deleteAttendance);

module.exports = router;
