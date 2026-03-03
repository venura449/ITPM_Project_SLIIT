const express = require('express');
const EmployeeController = require('../controllers/Bandara/EmployeeController');

const router = express.Router();

// Create a new employee
router.post('/', EmployeeController.createEmployee);

// Get all employees (with optional filters)
router.get('/', EmployeeController.getAllEmployees);

// Get employees by status
router.get('/status/:status', EmployeeController.getByStatus);

// Get employees by department
router.get('/department/:department', EmployeeController.getByDepartment);

// Get employee by ID with full profile
router.get('/:id', EmployeeController.getEmployeeById);

// Update employee information
router.put('/:id', EmployeeController.updateEmployee);

// Update employee status (Probation -> Permanent -> Resigned)
router.patch('/:id/status', EmployeeController.updateEmployeeStatus);

// Upload employee document
router.post('/:id/documents', EmployeeController.uploadDocument);

// Get employee documents
router.get('/:id/documents', EmployeeController.getDocuments);

// Delete employee document
router.delete('/:employeeId/documents/:docId', EmployeeController.deleteDocument);

// Delete employee
router.delete('/:id', EmployeeController.deleteEmployee);

module.exports = router;
