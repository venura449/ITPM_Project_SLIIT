const Employee = require('../../models/Samarawikrama/Employee');
const EmployeeDocument = require('../../models/Samarawikrama/EmployeeDocument');
const EmployeeRole = require('../../models/Samarawikrama/EmployeeRole');

class EmployeeService {
  /**
   * Create a new employee with role
   * @param {Object} employeeData - Employee data
   * @param {Object} roleData - Initial role data
   * @returns {Promise<Object>} Created employee with role
   */
  static async createEmployee(employeeData, roleData = null) {
    try {
      // Create employee record
      const employee = await Employee.create(employeeData);

      // Create initial role if provided
      if (roleData) {
        roleData.employee_id = employee.id;
        const role = await EmployeeRole.create(roleData);
        employee.current_role = role;
      }

      return {
        success: true,
        data: employee,
        message: 'Employee created successfully'
      };
    } catch (err) {
      throw {
        success: false,
        message: 'Failed to create employee: ' + err.message
      };
    }
  }

  /**
   * Get employee profile with all related data
   * @param {number} employeeId - Employee ID
   * @returns {Promise<Object>} Full employee profile
   */
  static async getEmployeeProfile(employeeId) {
    try {
      const employee = await Employee.findById(employeeId);

      if (!employee) {
        throw new Error('Employee not found');
      }

      // Get all documents
      const documents = await EmployeeDocument.getByEmployee(employeeId);

      // Get role history
      const roleHistory = await EmployeeRole.getByEmployee(employeeId);
      const currentRole = await EmployeeRole.getCurrentRole(employeeId);

      return {
        success: true,
        data: {
          ...employee,
          documents,
          roleHistory,
          currentRole
        },
        message: 'Employee profile retrieved'
      };
    } catch (err) {
      throw {
        success: false,
        message: err.message
      };
    }
  }

  /**
   * Update employee information
   * @param {number} employeeId - Employee ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated employee
   */
  static async updateEmployee(employeeId, updateData) {
    try {
      const employee = await Employee.update(employeeId, updateData);

      return {
        success: true,
        data: employee,
        message: 'Employee updated successfully'
      };
    } catch (err) {
      throw {
        success: false,
        message: 'Failed to update employee: ' + err.message
      };
    }
  }

  /**
   * Update employee status with lifecycle tracking
   * @param {number} employeeId - Employee ID
   * @param {string} newStatus - New status (Probation, Permanent, Resigned)
   * @param {Date} transitionDate - Date of transition
   * @param {Object} roleData - Optional new role data
   * @returns {Promise<Object>} Updated employee with new role
   */
  static async updateEmployeeStatus(
    employeeId,
    newStatus,
    transitionDate,
    roleData = null
  ) {
    try {
      // Update status
      const employee = await Employee.updateStatus(employeeId, newStatus, transitionDate);

      // If role data provided, end current role and create new one
      if (roleData) {
        const currentRole = await EmployeeRole.getCurrentRole(employeeId);

        if (currentRole) {
          await EmployeeRole.endRole(currentRole.id, transitionDate);
        }

        roleData.employee_id = employeeId;
        roleData.start_date = transitionDate;
        const newRole = await EmployeeRole.create(roleData);
        employee.current_role = newRole;
      }

      return {
        success: true,
        data: employee,
        message: `Employee status updated to ${newStatus}`
      };
    } catch (err) {
      throw {
        success: false,
        message: 'Failed to update status: ' + err.message
      };
    }
  }

  /**
   * Upload employee document
   * @param {number} employeeId - Employee ID
   * @param {string} documentType - Type of document
   * @param {string} documentName - Name of document
   * @param {string} filePath - File path/URL
   * @param {number} uploadedBy - User ID who uploaded
   * @returns {Promise<Object>} Created document
   */
  static async uploadDocument(
    employeeId,
    documentType,
    documentName,
    filePath,
    uploadedBy
  ) {
    try {
      const document = await EmployeeDocument.create({
        employee_id: employeeId,
        document_type: documentType,
        document_name: documentName,
        file_path: filePath,
        uploaded_by: uploadedBy
      });

      return {
        success: true,
        data: document,
        message: 'Document uploaded successfully'
      };
    } catch (err) {
      throw {
        success: false,
        message: 'Failed to upload document: ' + err.message
      };
    }
  }

  /**
   * Get all employees with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Array of employees
   */
  static async getAllEmployees(filters = {}) {
    try {
      const employees = await Employee.getAll(filters);

      return {
        success: true,
        data: employees,
        count: employees.length,
        message: 'Employees retrieved successfully'
      };
    } catch (err) {
      throw {
        success: false,
        message: 'Failed to retrieve employees: ' + err.message
      };
    }
  }

  /**
   * Delete employee record
   * @param {number} employeeId - Employee ID
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteEmployee(employeeId) {
    try {
      const deleted = await Employee.delete(employeeId);

      if (!deleted) {
        throw new Error('Employee not found');
      }

      return {
        success: true,
        message: 'Employee deleted successfully'
      };
    } catch (err) {
      throw {
        success: false,
        message: 'Failed to delete employee: ' + err.message
      };
    }
  }

  /**
   * Get employees by status
   * @param {string} status - Status to filter by
   * @returns {Promise<Object>} Filtered employees
   */
  static async getEmployeesByStatus(status) {
    try {
      const employees = await Employee.getByStatus(status);

      return {
        success: true,
        data: employees,
        count: employees.length,
        message: `${status} employees retrieved`
      };
    } catch (err) {
      throw {
        success: false,
        message: `Failed to retrieve ${status} employees: ` + err.message
      };
    }
  }

  /**
   * Get employees by department
   * @param {string} department - Department name
   * @returns {Promise<Object>} Employees in department
   */
  static async getEmployeesByDepartment(department) {
    try {
      const employees = await Employee.getByDepartment(department);

      return {
        success: true,
        data: employees,
        count: employees.length,
        message: `Employees in ${department} retrieved`
      };
    } catch (err) {
      throw {
        success: false,
        message: `Failed to retrieve department employees: ` + err.message
      };
    }
  }
}

module.exports = EmployeeService;
