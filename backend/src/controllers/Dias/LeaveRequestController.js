const LeaveRequest = require('../../models/Dias/LeaveRequest');
const LeaveBalance = require('../../models/Dias/LeaveBalance');

class LeaveRequestController {
    /**
     * Submit a new leave request
     * POST /api/leave/request
     */
    static async submitLeaveRequest(req, res) {
        try {
            const { leave_type, start_date, end_date, reason } = req.body;
            const employeeId = req.user.id;

            if (!leave_type || !start_date || !end_date || !reason) {
                return res.status(400).json({
                    success: false,
                    message: 'Leave type, start date, end date, and reason are required'
                });
            }

            // Validate dates
            const start = new Date(start_date);
            const end = new Date(end_date);

            if (start > end) {
                return res.status(400).json({
                    success: false,
                    message: 'Start date must be before end date'
                });
            }

            if (start < new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot submit leave request for past dates'
                });
            }

            const leaveRequest = await LeaveRequest.create({
                employeeId,
                leaveType: leave_type,
                startDate: start_date,
                endDate: end_date,
                reason
            });

            res.status(201).json({
                success: true,
                message: 'Leave request submitted successfully',
                data: leaveRequest
            });
        } catch (error) {
            console.error('Submit leave request error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit leave request',
                error: error.message
            });
        }
    }

    /**
     * Get leave requests for current user (employee)
     * GET /api/leave/my-requests
     */
    static async getMyLeaveRequests(req, res) {
        try {
            const employeeId = req.user.id;

            const leaveRequests = await LeaveRequest.getByEmployee(employeeId);

            res.status(200).json({
                success: true,
                message: 'Leave requests retrieved successfully',
                data: leaveRequests,
                total: leaveRequests.length
            });
        } catch (error) {
            console.error('Get leave requests error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve leave requests',
                error: error.message
            });
        }
    }

    /**
     * Get all leave requests for a specific employee (admin only)
     * GET /api/leave/employee/:employeeId
     */
    static async getEmployeeLeaveRequests(req, res) {
        try {
            const { employeeId } = req.params;
            const leaveRequests = await LeaveRequest.getByEmployee(Number(employeeId));
            res.status(200).json({
                success: true,
                message: 'Leave requests retrieved successfully',
                data: leaveRequests,
                total: leaveRequests.length
            });
        } catch (error) {
            console.error('Get employee leave requests error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve leave requests',
                error: error.message
            });
        }
    }

    /**
     * Get all pending leave requests (admin only)
     * GET /api/leave/pending
     */
    static async getPendingLeaveRequests(req, res) {
        try {
            const pendingRequests = await LeaveRequest.getPending();

            res.status(200).json({
                success: true,
                message: 'Pending leave requests retrieved successfully',
                data: pendingRequests,
                total: pendingRequests.length
            });
        } catch (error) {
            console.error('Get pending leave requests error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve pending leave requests',
                error: error.message
            });
        }
    }

    /**
     * Get leave request details
     * GET /api/leave/request/:id
     */
    static async getLeaveRequestDetails(req, res) {
        try {
            const { id } = req.params;

            const leaveRequest = await LeaveRequest.getById(id);

            if (!leaveRequest) {
                return res.status(404).json({
                    success: false,
                    message: 'Leave request not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Leave request details retrieved successfully',
                data: leaveRequest
            });
        } catch (error) {
            console.error('Get leave request details error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve leave request details',
                error: error.message
            });
        }
    }

    /**
     * Approve a leave request (admin only)
     * POST /api/leave/request/:id/approve
     */
    static async approveLeaveRequest(req, res) {
        try {
            const { id } = req.params;
            const { notes } = req.body;
            const approver = req.user.id;

            const leaveRequest = await LeaveRequest.getById(id);

            if (!leaveRequest) {
                return res.status(404).json({
                    success: false,
                    message: 'Leave request not found'
                });
            }

            if (leaveRequest.status !== 'Pending') {
                return res.status(400).json({
                    success: false,
                    message: `Cannot approve a ${leaveRequest.status.toLowerCase()} leave request`
                });
            }

            // Update leave balance
            const currentYear = new Date().getFullYear();
            await LeaveBalance.updateUsedDays(
                leaveRequest.employee_id,
                leaveRequest.leave_type,
                leaveRequest.days_applied,
                currentYear
            );

            const approvedRequest = await LeaveRequest.approve(id, approver, notes || '');

            res.status(200).json({
                success: true,
                message: 'Leave request approved successfully',
                data: approvedRequest
            });
        } catch (error) {
            console.error('Approve leave request error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to approve leave request',
                error: error.message
            });
        }
    }

    /**
     * Reject a leave request (admin only)
     * POST /api/leave/request/:id/reject
     */
    static async rejectLeaveRequest(req, res) {
        try {
            const { id } = req.params;
            const { notes } = req.body;
            const rejector = req.user.id;

            const leaveRequest = await LeaveRequest.getById(id);

            if (!leaveRequest) {
                return res.status(404).json({
                    success: false,
                    message: 'Leave request not found'
                });
            }

            if (leaveRequest.status !== 'Pending') {
                return res.status(400).json({
                    success: false,
                    message: `Cannot reject a ${leaveRequest.status.toLowerCase()} leave request`
                });
            }

            const rejectedRequest = await LeaveRequest.reject(id, rejector, notes || '');

            res.status(200).json({
                success: true,
                message: 'Leave request rejected successfully',
                data: rejectedRequest
            });
        } catch (error) {
            console.error('Reject leave request error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reject leave request',
                error: error.message
            });
        }
    }

    /**
     * Delete a leave request (only pending requests)
     * DELETE /api/leave/request/:id
     */
    static async deleteLeaveRequest(req, res) {
        try {
            const { id } = req.params;

            const success = await LeaveRequest.delete(id);

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Leave request not found or cannot be deleted'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Leave request deleted successfully'
            });
        } catch (error) {
            console.error('Delete leave request error:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                error: error.message
            });
        }
    }

    /**
     * Cancel an approved leave request
     * POST /api/leave/request/:id/cancel
     */
    static async cancelLeaveRequest(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const canceller = req.user.id;

            const leaveRequest = await LeaveRequest.getById(id);

            if (!leaveRequest) {
                return res.status(404).json({
                    success: false,
                    message: 'Leave request not found'
                });
            }

            if (leaveRequest.status !== 'Approved') {
                return res.status(400).json({
                    success: false,
                    message: `Cannot cancel a ${leaveRequest.status.toLowerCase()} leave request`
                });
            }

            // Revert leave balance
            const currentYear = new Date().getFullYear();
            await LeaveBalance.revertUsedDays(
                leaveRequest.employee_id,
                leaveRequest.leave_type,
                leaveRequest.days_applied,
                currentYear
            );

            const success = await LeaveRequest.cancel(id, canceller, reason || '');

            res.status(200).json({
                success: true,
                message: 'Leave request cancelled successfully'
            });
        } catch (error) {
            console.error('Cancel leave request error:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                error: error.message
            });
        }
    }

    /**
     * Get employee leave balance
     * GET /api/leave/balance/:employeeId?year=2024
     */
    static async getLeaveBalance(req, res) {
        try {
            const { employeeId } = req.params;
            const { year } = req.query;

            const currentYear = parseInt(year) || new Date().getFullYear();

            const balance = await LeaveBalance.getByEmployee(employeeId, currentYear);

            res.status(200).json({
                success: true,
                message: 'Leave balance retrieved successfully',
                employee_id: employeeId,
                year: currentYear,
                data: balance
            });
        } catch (error) {
            console.error('Get leave balance error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve leave balance',
                error: error.message
            });
        }
    }
}

module.exports = LeaveRequestController;
