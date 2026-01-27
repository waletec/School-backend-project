import db from '../config/db.js';

// This model contains raw queries. You can later refactor to use an ORM if desired.

const StudentModel = {
  /**
   * Search students by (partial) name and optional class.
   */
  async searchStudents({ name, classId }) {
    const searchTerm = `%${name}%`;
    if (classId) {
      const [rows] = await db.query(
        `SELECT s.id, s.full_name, c.id AS class_id, c.name AS class_name
         FROM students s
         JOIN classes c ON s.class_id = c.id
         WHERE s.full_name LIKE ? AND c.id = ?`,
        [searchTerm, classId]
      );
      return rows;
    }

    const [rows] = await db.query(
      `SELECT s.id, s.full_name, c.id AS class_id, c.name AS class_name
       FROM students s
       JOIN classes c ON s.class_id = c.id
       WHERE s.full_name LIKE ?`,
      [searchTerm]
    );
    return rows;
  },

  /**
   * Get full student profile, including basic details and class.
   */
  async getStudentById(studentId) {
    const [rows] = await db.query(
      `SELECT s.id, s.full_name, s.admission_no, c.id AS class_id, c.name AS class_name
       FROM students s
       JOIN classes c ON s.class_id = c.id
       WHERE s.id = ?`,
      [studentId]
    );
    return rows[0] || null;
  },

  /**
   * Get current term bills for a student, including payment status summary.
   */
  async getStudentBills(studentId, { termId } = {}) {
    const params = [studentId];
    let termFilter = '';
    if (termId) {
      termFilter = 'AND b.term_id = ?';
      params.push(termId);
    }

    const [rows] = await db.query(
      `SELECT 
          b.id,
          b.description,
          b.amount,
          b.due_date,
          t.name AS term_name,
          t.session,
          COALESCE(SUM(p.amount), 0) AS amount_paid,
          CASE 
            WHEN COALESCE(SUM(p.amount), 0) >= b.amount THEN 'PAID'
            WHEN COALESCE(SUM(p.amount), 0) = 0 THEN 'UNPAID'
            ELSE 'PARTIALLY_PAID'
          END AS status
       FROM bills b
       JOIN terms t ON b.term_id = t.id
       LEFT JOIN payments p ON p.bill_id = b.id AND p.status = 'SUCCESS'
       WHERE b.student_id = ?
       ${termFilter}
       GROUP BY b.id
       ORDER BY t.session DESC, t.name DESC, b.due_date DESC`,
      params
    );
    return rows;
  },

  /**
   * Get student term report (for report card / download).
   */
  async getStudentTermReport(studentId, { termId }) {
    const [rows] = await db.query(
      `SELECT 
          r.id,
          r.term_id,
          t.name AS term_name,
          t.session,
          r.overall_comment,
          r.position_in_class,
          r.total_score,
          r.average_score,
          r.created_at
       FROM reports r
       JOIN terms t ON r.term_id = t.id
       WHERE r.student_id = ? AND r.term_id = ?`,
      [studentId, termId]
    );
    return rows[0] || null;
  },
};

export default StudentModel;

