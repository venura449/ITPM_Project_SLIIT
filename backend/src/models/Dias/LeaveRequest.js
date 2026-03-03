const pool = require('../../../config/database');

class LeaveRequest {
    /**
     * Create a new leave request
     * @param {Object} leaveData - {employeeId, leaveType, startDate, endDate, reason}
     * @returns {Promise<Object>} Created leave request
     */
    static async create(leaveData) {
        const connection = await pool.getConnection();
        try {
            const { employeeId, leaveType, startDate, endDate, reason } = leaveData;

            // Calculate days applied (including weekends for now, adjust as needed)
            const start = new Date(startDate);
            const end = new Date(endDate);
            const daysApplied = (end - start) / (1000 * 60 * 60 * 24) + 1;

            const [result] = await connection.query(
                `INSERT INTO leave_requests 
         (employee_id, leave_type, start_date, end_date, days_applied, reason)
         VALUES (?, ?, ?, ?, ?, ?)`,
                [employeeId, leaveType, startDate, endDate, daysApplied, reason]
            );

            return { id: result.insertId, ...leaveData, days_applied: daysApplied, status: 'Pending' };
        } finally {
            connection.release();
        }
    }

    /**
     * Get all leave requests for an employee
     * @param {number} employeeId - Employee ID
     * @returns {Promise<Array>} Array of leave requests
     */
    static async getByEmployee(employeeId) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                `SELECT lr.*, e.name, u.name as approved_by_name
         FROM leave_requests lr
         JOIN employees e ON lr.employee_id = e.id
         LEFT JOIN users u ON lr.approved_by = u.id
         WHERE lr.employee_id = ?
         ORDER BY lr.start_date DESC`,
                [employeeId]
            );
            return rows;
        } finally {
            connection.release();
        }
    }

    /**
     * Get all pending leave requests (for admin approval)
     * @returns {Promise<Array>} Array of pending leave requests
     */
    static async getPending() {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                `SELECT lr.*, e.name, e.employee_id AS employee_code, e.department, e.email
         FROM leave_requests lr
         JOIN employees e ON lr.employee_id = e.id
         WHERE lr.status = 'Pending'
         ORDER BY lr.created_at ASC`
            );
            return rows;
        } finally {
            connection.release();
        }
    }

    /**
     * Get all leave requests for a date range
     * @param {Date} startDate - Range start date
     * @param {Date} endDate - Range end date
     * @returns {Promise<Array>} Array of approved leave requests
     */
    static async getApprovedByDateRange(startDate, endDate) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                `SELECT lr.*, e.name, e.employee_id AS employee_code, e.department
         FROM leave_requests lr
         JOIN employees e ON lr.employee_id = e.id
         WHERE lr.status = 'Approved' 
         AND lr.start_date <= ? 
         AND lr.end_date >= ?
         ORDER BY lr.start_date ASC`,
                [endDate, startDate]
            );
            return rows;
        } finally {
            connection.release();
        }
    }

    /**
     * Get leave request by ID
     * @param {number} id - Leave request ID
     * @returns {Promise<Object|null>} Leave request or null
     */
    static async getById(id) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                `SELECT lr.*, e.name, e.employee_id AS employee_code
         FROM leave_requests lr
         JOIN employees e ON lr.employee_id = e.id
         WHERE lr.id = ?`,
                [id]
            );
            return rows.length > 0 ? rows[0] : null;
        } finally {
            connection.release();
        }
    }

    /**
     * Approve leave request
     * @param {number} id - Leave request ID
     * @param {number} approvedBy - User ID approving the request
     * @param {string} notes - Approval notes (optional)
     * @returns {Promise<Object>} Updated leave request
     */
    static async approve(id, approvedBy, notes = '') {
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.query(
                `UPDATE leave_requests 
         SET status = 'Approved', approved_by = ?, approval_notes = ?, approved_at = NOW()
         WHERE id = ?`,
                [approvedBy, notes, id]
            );

            if (result.affectedRows === 0) {
                throw new Error('Leave request not found');
            }

            // Update attendance records for the leave dates
            const leaveRequest = await this.getById(id);
            if (leaveRequest) {
                const start = new Date(leaveRequest.start_date);
                const end = new Date(leaveRequest.end_date);

                for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    await connection.query(
                        `INSERT INTO attendance (employee_id, attendance_date, status, notes, marked_by)
             VALUES (?, ?, 'Leave', ?, ?)
             ON DUPLICATE KEY UPDATE status = 'Leave', notes = ?, marked_by = ?`,
                        [leaveRequest.employee_id, dateStr, `Auto-marked from approved leave request #${id}`, approvedBy, `Auto-marked from approved leave request #${id}`, approvedBy]
                    );
                }
            }

            return await this.getById(id);
        } finally {
            connection.release();
        }
    }

    /**
     * Reject leave request
     * @param {number} id - Leave request ID
     * @param {number} rejectedBy - User ID rejecting the request
     * @param {string} notes - Rejection notes (optional)
     * @returns {Promise<Object>} Updated leave request
     */
    static async reject(id, rejectedBy, notes = '') {
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.query(
                `UPDATE leave_requests 
         SET status = 'Rejected', approved_by = ?, approval_notes = ?, approved_at = NOW()
         WHERE id = ?`,
                [rejectedBy, notes, id]
            );

            if (result.affectedRows === 0) {
                throw new Error('Leave request not found');
            }

            return await this.getById(id);
        } finally {
            connection.release();
        }
    }

    /**
     * Delete leave request (only if pending)
     * @param {number} id - Leave request ID
     * @returns {Promise<boolean>} True if successful
     */
    static async delete(id) {
        const connection = await pool.getConnection();
        try {
            const leaveRequest = await this.getById(id);

            if (leaveRequest && leaveRequest.status !== 'Pending') {
                throw new Error('Can only delete pending leave requests');
            }

            const [result] = await connection.query(
                'DELETE FROM leave_requests WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } finally {
            connection.release();
        }
    }

    /**
     * Cancel approved leave request
     * @param {number} id - Leave request ID
     * @param {number} cancelledBy - User ID cancelling the request
     * @param {string} reason - Cancellation reason
     * @returns {Promise<boolean>} True if successful
     */
    static async cancel(id, cancelledBy, reason = '') {
        const connection = await pool.getConnection();
        try {
            const leaveRequest = await this.getById(id);

            if (leaveRequest && leaveRequest.status !== 'Approved') {
                throw new Error('Can only cancel approved leave requests');
            }

            // Revert attendance records
            const start = new Date(leaveRequest.start_date);
            const end = new Date(leaveRequest.end_date);

            for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                await connection.query(
                    `DELETE FROM attendance WHERE employee_id = ? AND DATE(attendance_date) = ? AND status = 'Leave'`,
                    [leaveRequest.employee_id, dateStr]
                );
            }

            // Update leave request status
            await connection.query(
                `UPDATE leave_requests 
         SET status = 'Cancelled', approved_by = ?, approval_notes = ?, approved_at = NOW()
         WHERE id = ?`,
                [cancelledBy, reason, id]
            );

            return true;
        } finally {
            connection.release();
        }
    }
}

module.exports = LeaveRequest;
