const express = require('express');
const TrainingController = require('../controllers/Dias/TrainingController');

const router = express.Router();

// Training Programs
router.post('/programs', TrainingController.createProgram);
router.get('/programs', TrainingController.getAllPrograms);
router.get('/programs/:programId', TrainingController.getProgramDetails);
router.put('/programs/:programId', TrainingController.updateProgram);
router.delete('/programs/:programId', TrainingController.deleteProgram);

// Training Sessions
router.post('/sessions', TrainingController.createSession);
router.get('/sessions/:sessionId', TrainingController.getSessionDetails);

// Employee Assignments
router.post('/programs/:programId/assign', TrainingController.assignEmployees);
router.get('/assignments', TrainingController.getAllAssignments);
router.patch('/assignments/:assignmentId/status', TrainingController.updateAssignmentStatus);
router.delete('/assignments/:assignmentId', TrainingController.deleteAssignment);

// Attendance Tracking
router.post('/sessions/:sessionId/attendance', TrainingController.markAttendance);
router.put('/attendance/:attendanceId', TrainingController.updateAttendance);

// Employee Training History
router.get('/employees/:employeeId/history', TrainingController.getEmployeeTrainingHistory);

module.exports = router;
