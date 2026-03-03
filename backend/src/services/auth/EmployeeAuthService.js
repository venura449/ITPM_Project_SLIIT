const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Employee = require('../../models/Bandara/Employee');
require('dotenv').config();

class EmployeeAuthService {
    /**
     * Generate a random password
     * @returns {string} Random password
     */
    static generatePassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    /**
     * Hash password
     * @param {string} password - Plain password
     * @returns {Promise<string>} Hashed password
     */
    static async hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    /**
     * Compare password with hash
     * @param {string} password - Plain password
     * @param {string} hashedPassword - Hashed password
     * @returns {Promise<boolean>} True if password matches
     */
    static async comparePassword(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }

    /**
     * Generate password for employee (Admin only)
     * @param {number} employeeId - Employee ID (database ID)
     * @returns {Promise<Object>} {success: boolean, message: string, password?: string}
     */
    static async generateEmployeePassword(employeeId) {
        try {
            const employee = await Employee.findById(employeeId);
            if (!employee) {
                return {
                    success: false,
                    message: 'Employee not found'
                };
            }

            const plainPassword = this.generatePassword();
            const hashedPassword = await this.hashPassword(plainPassword);

            // Update employee with new password and timestamp
            const connection = require('../../../config/database');
            const conn = await connection.getConnection();
            try {
                await conn.query(
                    'UPDATE employees SET password = ?, password_generated_at = NOW() WHERE id = ?',
                    [hashedPassword, employeeId]
                );
            } finally {
                conn.release();
            }

            return {
                success: true,
                message: 'Password generated successfully',
                password: plainPassword,
                employee_id: employee.employee_id,
                employee_name: employee.name
            };
        } catch (error) {
            console.error('Generate password error:', error);
            return {
                success: false,
                message: 'Failed to generate password: ' + error.message
            };
        }
    }

    /**
     * Employee login with employee_id and password
     * @param {string} employeeId - Employee ID (e.g., EMP001)
     * @param {string} password - Employee password
     * @returns {Promise<Object>} {success: boolean, message: string, user?: Object, token?: string}
     */
    static async login(employeeId, password) {
        try {
            // Validate input
            if (!employeeId || !password) {
                return {
                    success: false,
                    message: 'Employee ID and password are required'
                };
            }

            // Find employee by employee_id
            const employee = await Employee.findByEmployeeId(employeeId);
            if (!employee) {
                return {
                    success: false,
                    message: 'Invalid employee ID or password'
                };
            }

            // Check if password was set
            if (!employee.password) {
                return {
                    success: false,
                    message: 'Password not set. Please contact your administrator.'
                };
            }

            // Compare passwords
            const isPasswordValid = await this.comparePassword(password, employee.password);
            if (!isPasswordValid) {
                return {
                    success: false,
                    message: 'Invalid employee ID or password'
                };
            }

            // Generate token
            const token = this.generateToken(employee.id, 'employee');

            return {
                success: true,
                message: 'Login successful',
                user: {
                    id: employee.id,
                    employee_id: employee.employee_id,
                    name: employee.name,
                    email: employee.email,
                    phone: employee.phone,
                    department: employee.department,
                    position: employee.position,
                    designation: employee.designation,
                    status: employee.status,
                    salary: employee.salary,
                    address: employee.address
                },
                token,
                userType: 'employee'
            };
        } catch (error) {
            console.error('Employee login error:', error);
            return {
                success: false,
                message: 'Login failed: ' + error.message
            };
        }
    }

    /**
     * Change employee password
     * @param {number} employeeId - Employee ID
     * @param {string} oldPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<Object>} {success: boolean, message: string}
     */
    static async changePassword(employeeId, oldPassword, newPassword) {
        try {
            if (!oldPassword || !newPassword) {
                return {
                    success: false,
                    message: 'Old password and new password are required'
                };
            }

            if (newPassword.length < 6) {
                return {
                    success: false,
                    message: 'New password must be at least 6 characters long'
                };
            }

            // Get employee
            const employee = await Employee.findById(employeeId);
            if (!employee) {
                return {
                    success: false,
                    message: 'Employee not found'
                };
            }

            if (!employee.password) {
                return {
                    success: false,
                    message: 'Password not set'
                };
            }

            // Verify old password
            const isPasswordValid = await this.comparePassword(oldPassword, employee.password);
            if (!isPasswordValid) {
                return {
                    success: false,
                    message: 'Current password is incorrect'
                };
            }

            // Hash new password
            const hashedPassword = await this.hashPassword(newPassword);

            // Update password
            const connection = require('../../../config/database');
            const conn = await connection.getConnection();
            try {
                await conn.query(
                    'UPDATE employees SET password = ?, password_generated_at = NOW() WHERE id = ?',
                    [hashedPassword, employeeId]
                );
            } finally {
                conn.release();
            }

            return {
                success: true,
                message: 'Password changed successfully'
            };
        } catch (error) {
            console.error('Change password error:', error);
            return {
                success: false,
                message: 'Password change failed: ' + error.message
            };
        }
    }

    /**
     * Generate JWT token
     * @param {number} userId - User/Employee ID
     * @param {string} userType - 'employee' or 'user'
     * @returns {string} JWT token
     */
    static generateToken(userId, userType = 'employee') {
        return jwt.sign(
            { id: userId, type: userType },
            process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production',
            { expiresIn: process.env.JWT_EXPIRY || '7d' }
        );
    }

    /**
     * Get employee profile
     * @param {number} employeeId - Employee ID
     * @returns {Promise<Object|null>} Employee object or null
     */
    static async getEmployeeProfile(employeeId) {
        try {
            return await Employee.findById(employeeId);
        } catch (error) {
            console.error('Get profile error:', error);
            return null;
        }
    }

    /**
     * Update employee profile (limited fields for employee)
     * @param {number} employeeId - Employee ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} {success: boolean, message: string, user?: Object}
     */
    static async updateEmployeeProfile(employeeId, updateData) {
        try {
            // Only allow certain fields to be updated by employee
            const allowedFields = ['phone', 'address'];
            const filteredData = {};

            for (const field of allowedFields) {
                if (updateData[field] !== undefined) {
                    filteredData[field] = updateData[field];
                }
            }

            if (Object.keys(filteredData).length === 0) {
                return {
                    success: false,
                    message: 'No valid fields to update'
                };
            }

            const updatedEmployee = await Employee.update(employeeId, filteredData);

            return {
                success: true,
                message: 'Profile updated successfully',
                user: updatedEmployee
            };
        } catch (error) {
            console.error('Update profile error:', error);
            return {
                success: false,
                message: 'Update failed: ' + error.message
            };
        }
    }
}

module.exports = EmployeeAuthService;
