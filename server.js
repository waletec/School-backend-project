import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import pool from './config/db.js';
// import db from './config/db.js';

import studentRoutes from './routes/studentRoutes.js';
import db from './config/db.js';

const app = express();
const PORT = process.env.PORT || 5000;

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({ message: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
        if (err) return res.status(401).json({ message: 'Unauthorized' });
        req.user = user; // Add user info to the request
        next();
    });
};

// 1. MIDDLEWARE (Must come before routes)
app.use(express.json()); 
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.urlencoded({ extended: true }));

// 2. ROUTES
app.get('/', (req, res) => {
  res.json({ message: 'School Portal API running' });
});


// Login Route (Defined BEFORE app.listen)
app.post('/api/login', async (req, res) => {
    console.log("Login attempt for:", req.body);
    const { username, userId, password } = req.body;

    try {
        const [rows] = await db.execute(
           'SELECT * FROM Parents WHERE ParentsId = ? AND name = ? AND password = SHA2(?, 256)',
            [userId, username, password]
        );

        if (rows.length > 0) {
            const parent = rows[0];
            const token = jwt.sign(
                { id: parent.ParentsId, name: parent.name },
                process.env.JWT_SECRET || 'fallback_secret',
                { expiresIn: '24h' }
            );
            res.json({ success: true, token, parentId: parent.ParentsId });
        } else {
            res.status(401).json({ success: false, message: "Invalid Credentials" });
        }
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: err.message });
    }
});

//parent details routes
app.get('/api/parent/details', verifyToken, async (req, res) => {
    try{
        const [rows] = await db.execute("SELECT * FROM Parents WHERE ParentsId = ?", [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ message: "Not found" });
        res.json(rows[0]);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
    // Use the ID we extracted from the token in the middleware
    });
app.get('/api/parent/children', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT StudentId AS id, Name AS name, Class AS className, Status AS status, ParentsId FROM Students WHERE ParentsId = ?', [req.user.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/parent/TotalBill', verifyToken, async (req, res) => {
        try{
            const [rows] = await db.execute("SELECT amount FROM gb_002_ptras WHERE paid_flag = 'N' AND journal_number = ?", [req.user.id]);
            if (rows.length === 0) return res.status(404).json({ message: "Not found" });
            res.json(rows[0]);
        } catch(err) {
            res.status(500).json({ error: err.message });
        }
        // Use the ID we extracted from the token in the middleware
    });


//Children transactions and reports routes
app.get('/api/student/report1/:studentId', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM gb_002_schmark WHERE student_code = ? ', [req.params.studentId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/student/report2/:studentId', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM st_002_schbal WHERE student_code = ? ', [req.params.studentId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/parents/transactions/:studentId', verifyToken, async (req, res) => {
    try {

        const parentId = req.user.id;      
        const studentId  = req.params.studentId;


        const [rows] = await pool.execute(
            "SELECT journal_number AS parentId, account_code AS studentId, description, amount, paid_flag, transaction_date, currency_code, reference_number, amount_type FROM gb_002_ptras WHERE journal_number = ? AND account_code = ? ORDER BY transaction_date DESC",
           [parentId, studentId]
    );   
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});  
              

// Example Payment Confirmation Route // work in progress
app.post('/api/pay-bill', async (req, res) => {
    const { billId, transactionId } = req.body;
  
    try {
      // 1. Record the payment in your TransactionHistory table
      await db.query(
        'INSERT INTO TransactionHistory (BillId, TransactionId, Date) VALUES (?, ?, NOW())',
        [billId, transactionId]
      );
  
      // 2. UPDATE the Status in the Billing table
      await db.query(
        'UPDATE Billing SET Status = "Paid" WHERE BillId = ?',
        [billId]
      );
  
      res.status(200).send("Payment successful and status updated.");
    } catch (err) {
      res.status(500).send("Database update failed.");
    }
  });
  

app.use('/api/students', studentRoutes);

// 3. ERROR HANDLER
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// 4. START SERVER (Always at the very bottom)
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
