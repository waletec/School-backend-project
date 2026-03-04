import StudentModel from '../models/studentModel.js';

const StudentController = {

  async getDetails(req, res, next) {
    try {
      const { id } = req.params;
      const student = await StudentModel.getStudentById(id);
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      res.json(student);
    } catch (err) {
      next(err);
    }
  },

  async getBills(req, res, next) {
    try {
      const { id } = req.params;
      const { termId } = req.query;
      const bills = await StudentModel.getStudentBills(id, { termId });
      res.json(bills);
    } catch (err) {
      next(err);
    }
  },

  async getReport(req, res, next) {
    try {
      const { id } = req.params;
      const { termId } = req.query;
      if (!termId) {
        return res.status(400).json({ error: 'termId query parameter is required' });
      }
      const report = await StudentModel.getStudentTermReport(id, { termId });
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.json(report);
    } catch (err) {
      next(err);
    }
  },
};

export default StudentController;

