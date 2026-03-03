const express = require('express');
const LeaveRequestController = require('../controllers/Dias/LeaveRequestController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Submit new leave request
router.post('/request', LeaveRequestController.submitLeaveRequest);

// Get my leave requests
router.get('/my-requests', LeaveRequestController.getMyLeaveRequests);

// Get all pending leave requests (admin only)
router.get('/pending', LeaveRequestController.getPendingLeaveRequests);

// Get leave request details
router.get('/request/:id', LeaveRequestController.getLeaveRequestDetails);

// Approve leave request
router.post('/request/:id/approve', LeaveRequestController.approveLeaveRequest);

// Reject leave request
router.post('/request/:id/reject', LeaveRequestController.rejectLeaveRequest);

// Delete leave request
router.delete('/request/:id', LeaveRequestController.deleteLeaveRequest);

// Cancel approved leave request
router.post('/request/:id/cancel', LeaveRequestController.cancelLeaveRequest);

// Get leave balance for employee
router.get('/balance/:employeeId', LeaveRequestController.getLeaveBalance);

// Get all leave requests for a specific employee (admin)
router.get('/employee/:employeeId', LeaveRequestController.getEmployeeLeaveRequests);

module.exports = router;
