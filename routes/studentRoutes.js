import express from 'express';
import StudentController from '../controllers/studentController.js';

const router = express.Router();

// Client/Admin: search students by name + optional class
router.get('/search', StudentController.search);

// Get student basic details
router.get('/:id', StudentController.getDetails);

// Get student bills (optionally filtered by termId)
router.get('/:id/bills', StudentController.getBills);

// Get student term report
router.get('/:id/report', StudentController.getReport);

export default router;

