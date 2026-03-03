const EmployeeService = require('../../services/Bandara/EmployeeService');
const Employee = require('../../models/Bandara/Employee');
const EmployeeDocument = require('../../models/Bandara/EmployeeDocument');

class EmployeeController {
  /**
   * Create a new employee
   * POST /api/employees
   */
  static async createEmployee(req, res) {
    try {
      const {
        user_id,
        employee_id,
        name,
        email,
        phone,
        address,
        department,
        position,
        status,
        joining_date,
        probation_end_date,
        salary,
        designation,
        manager_id,
        notes,
        role
      } = req.body;

      // Validate required fields
      if (!employee_id || !joining_date) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: employee_id, joining_date'
        });
      }

      // Check if employee_id already exists
      if (await Employee.employeeIdExists(employee_id)) {
        return res.status(409).json({
          success: false,
          message: 'Employee ID already exists'
        });
      }

      const employeeData = {
        user_id: user_id || null,
        employee_id,
        name,
        email,
        phone,
        address,
        department,
        position,
        status: status || 'Probation',
        joining_date,
        probation_end_date,
        salary,
        designation,
        manager_id,
        notes
      };

      const roleData = role ? { ...role, start_date: joining_date } : null;

      const result = await EmployeeService.createEmployee(employeeData, roleData);

      return res.status(201).json(result);
    } catch (err) {
      console.error('Create employee error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to create employee'
      });
    }
  }

  /**
   * Get employee by ID
   * GET /api/employees/:id
   */
  static async getEmployeeById(req, res) {
    try {
      const { id } = req.params;

      const result = await EmployeeService.getEmployeeProfile(id);

      return res.status(200).json(result);
    } catch (err) {
      console.error('Get employee error:', err);
      return res.status(404).json({
        success: false,
        message: err.message || 'Employee not found'
      });
    }
  }

  /**
   * Get all employees
   * GET /api/employees?department=&status=&search=
   */
  static async getAllEmployees(req, res) {
    try {
      const { department, status, search } = req.query;

      const filters = {};
      if (department) filters.department = department;
      if (status) filters.status = status;
      if (search) filters.search = search;

      const result = await EmployeeService.getAllEmployees(filters);

      return res.status(200).json(result);
    } catch (err) {
      console.error('Get all employees error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to retrieve employees'
      });
    }
  }

  /**
   * Update employee
   * PUT /api/employees/:id
   */
  static async updateEmployee(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const result = await EmployeeService.updateEmployee(id, updateData);

      return res.status(200).json(result);
    } catch (err) {
      console.error('Update employee error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to update employee'
      });
    }
  }

  /**
   * Update employee status
   * PATCH /api/employees/:id/status
   */
  static async updateEmployeeStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, transition_date, role } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      const result = await EmployeeService.updateEmployeeStatus(
        id,
        status,
        transition_date || new Date(),
        role
      );

      return res.status(200).json(result);
    } catch (err) {
      console.error('Update status error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to update status'
      });
    }
  }

  /**
   * Upload employee document
   * POST /api/employees/:id/documents
   */
  static async uploadDocument(req, res) {
    try {
      const { id } = req.params;
      const { document_type, document_name, file_path } = req.body;
      const uploadedBy = req.user?.id; // Assuming auth middleware adds user

      if (!document_type || !document_name || !file_path) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: document_type, document_name, file_path'
        });
      }

      const result = await EmployeeService.uploadDocument(
        id,
        document_type,
        document_name,
        file_path,
        uploadedBy
      );

      return res.status(201).json(result);
    } catch (err) {
      console.error('Upload document error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to upload document'
      });
    }
  }

  /**
   * Get employee documents
   * GET /api/employees/:id/documents?type=
   */
  static async getDocuments(req, res) {
    try {
      const { id } = req.params;
      const { type } = req.query;

      let documents;
      if (type) {
        documents = await EmployeeDocument.getByType(id, type);
      } else {
        documents = await EmployeeDocument.getByEmployee(id);
      }

      return res.status(200).json({
        success: true,
        data: documents,
        count: documents.length,
        message: 'Documents retrieved successfully'
      });
    } catch (err) {
      console.error('Get documents error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to retrieve documents'
      });
    }
  }

  /**
   * Delete document
   * DELETE /api/employees/:employeeId/documents/:docId
   */
  static async deleteDocument(req, res) {
    try {
      const { employeeId, docId } = req.params;

      const deleted = await EmployeeDocument.delete(docId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (err) {
      console.error('Delete document error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to delete document'
      });
    }
  }

  /**
   * Get employees by status
   * GET /api/employees/status/:status
   */
  static async getByStatus(req, res) {
    try {
      const { status } = req.params;

      const result = await EmployeeService.getEmployeesByStatus(status);

      return res.status(200).json(result);
    } catch (err) {
      console.error('Get by status error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to retrieve employees'
      });
    }
  }

  /**
   * Get employees by department
   * GET /api/employees/department/:department
   */
  static async getByDepartment(req, res) {
    try {
      const { department } = req.params;

      const result = await EmployeeService.getEmployeesByDepartment(department);

      return res.status(200).json(result);
    } catch (err) {
      console.error('Get by department error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to retrieve employees'
      });
    }
  }

  /**
   * Delete employee
   * DELETE /api/employees/:id
   */
  static async deleteEmployee(req, res) {
    try {
      const { id } = req.params;

      const result = await EmployeeService.deleteEmployee(id);

      return res.status(200).json(result);
    } catch (err) {
      console.error('Delete employee error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to delete employee'
      });
    }
  }
}

module.exports = EmployeeController;
