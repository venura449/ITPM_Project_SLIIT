const EmployeeAuthService = require('../../services/auth/EmployeeAuthService');

class EmployeeAuthController {
    /**
     * Generate password for an employee (Admin only)
     * POST /api/employee-auth/generate-password
     */
    static async generatePassword(req, res) {
        try {
            const { employee_id } = req.body;

            if (!employee_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Employee ID is required'
                });
            }

            const result = await EmployeeAuthService.generateEmployeePassword(employee_id);

            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: {
                        employee_id: result.employee_id,
                        employee_name: result.employee_name,
                        password: result.password,
                        note: 'Please share this password with the employee securely. They can change it after first login.'
                    }
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('Generate password error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate password',
                error: error.message
            });
        }
    }

    /**
     * Employee login with employee_id and password
     * POST /api/employee-auth/login
     */
    static async login(req, res) {
        try {
            const { employee_id, password } = req.body;

            if (!employee_id || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Employee ID and password are required'
                });
            }

            const result = await EmployeeAuthService.login(employee_id, password);

            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    user: result.user,
                    token: result.token,
                    userType: result.userType
                });
            } else {
                res.status(401).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('Employee login error:', error);
            res.status(500).json({
                success: false,
                message: 'Login failed',
                error: error.message
            });
        }
    }

    /**
     * Get employee profile
     * GET /api/employee-auth/profile
     */
    static async getProfile(req, res) {
        try {
            const employeeId = req.user.id;

            const employee = await EmployeeAuthService.getEmployeeProfile(employeeId);

            if (!employee) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
            }

            // Don't return password
            const { password, password_generated_at, ...safeEmployee } = employee;

            res.status(200).json({
                success: true,
                message: 'Profile retrieved successfully',
                user: safeEmployee
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve profile',
                error: error.message
            });
        }
    }

    /**
     * Update employee profile
     * PUT /api/employee-auth/profile
     */
    static async updateProfile(req, res) {
        try {
            const employeeId = req.user.id;
            const result = await EmployeeAuthService.updateEmployeeProfile(employeeId, req.body);

            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    user: result.user
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile',
                error: error.message
            });
        }
    }

    /**
     * Change employee password
     * PUT /api/employee-auth/change-password
     */
    static async changePassword(req, res) {
        try {
            const employeeId = req.user.id;
            const { oldPassword, newPassword } = req.body;

            if (!oldPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Old password and new password are required'
                });
            }

            const result = await EmployeeAuthService.changePassword(employeeId, oldPassword, newPassword);

            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to change password',
                error: error.message
            });
        }
    }

    /**
     * Verify token
     * POST /api/employee-auth/verify
     */
    static async verifyToken(req, res) {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Token is required'
                });
            }

            const decoded = EmployeeAuthService.verifyToken(token);
            if (!decoded) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired token'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Token is valid',
                decoded
            });
        } catch (error) {
            console.error('Verify token error:', error);
            res.status(500).json({
                success: false,
                message: 'Token verification failed',
                error: error.message
            });
        }
    }

    /**
     * Logout (client removes token)
     * POST /api/employee-auth/logout
     */
    static async logout(req, res) {
        try {
            res.status(200).json({
                success: true,
                message: 'Logout successful. Please remove the token from client storage.'
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Logout failed',
                error: error.message
            });
        }
    }
}

module.exports = EmployeeAuthController;
