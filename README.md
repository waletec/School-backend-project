## School Portal Backend (Node.js + Express + MySQL)

This project is a backend API for a school portal with two main consumers:

- **Client portal**: parents/staff can search students, view bills, pay fees (via Remita later), and download reports.
- **Admin portal**: can use the same APIs plus future admin-only endpoints.

The backend is built with **Node.js (ES modules)**, **Express 5**, and **MySQL** using `mysql2`.

---

## Overview & purpose

This backend provides a **single source of truth** for:

- **Students**: identity and class.
- **Bills & payments**: amounts, term, and computed status (PAID / UNPAID / PARTIALLY_PAID).
- **Reports**: high-level term results and comments.

Frontends (Flutter, React, mobile/web) consume simple JSON REST APIs to:

- Search students by name/class.
- View student details.
- View bills and payment status.
- Fetch a student’s term report (for report cards / downloads).

Key benefits:

- **Consistency** – all portals see the same data.
- **Security** – billing/report logic lives on the server, not duplicated in frontends.
- **Scalability** – new frontends can be added by reusing the same APIs.
- **Maintainability** – changing business rules is done once in the backend.

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create a `.env` file in the project root (same folder as `package.json`):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=school_portal
PORT=5000
```

Adjust values to match your local MySQL setup.

### 3. Database schema (MySQL)

Create a database and add at least these core tables (simplified view):

- **`classes`**: class name/level.
- **`students`**: basic student info and `class_id`.
- **`terms`**: term name and session (e.g. `1st Term`, `2025/2026`).
- **`bills`**: per-student, per-term bills (amount, description, due date).
- **`payments`**: payments made against bills (amount, status).
- **`reports`**: per-student, per-term academic summary.

Exact column definitions can follow typical `INT` primary keys, foreign keys between these tables, and timestamps (see previous iterations or migrations if needed).

### 4. Run the server

```bash
npm run dev
```

Server will start on `http://localhost:5000` by default.

---

## Health check

- **Check API is running**
  - **GET** `/`
  - **Response**:
    - `{ "message": "School Portal API running" }`

- **Check DB connection**
  - **GET** `/health/db`
  - **Success**:
    - `{ "ok": true, "message": "Database connected" }`
  - **Failure**:
    - `{ "ok": false, "message": "Database connection failed" }`

---

## Student APIs (for frontend use)

Base URL for all student endpoints:

- `http://localhost:5000/api/students`

### 1) Search students

- **Method**: `GET`
- **Path**: `/api/students/search`
- **Query params**:
  - `name` (string, required) – partial or full student name.
  - `classId` (number, optional) – filter by class.
- **Example request**:

```http
GET /api/students/search?name=John&classId=3
Host: localhost:5000
```

- **Example response** (`200 OK`):

```json
[
  {
    "id": 12,
    "full_name": "John Doe",
    "class_id": 3,
    "class_name": "JSS1 A"
  }
]
```

**Usage (frontend)**: use this for the search box on the client portal. Call it when user types a name and selects a class.

---

### 2) Get student details

- **Method**: `GET`
- **Path**: `/api/students/:id`
- **Example**:

```http
GET /api/students/12
Host: localhost:5000
```

- **Example response** (`200 OK`):

```json
{
  "id": 12,
  "full_name": "John Doe",
  "admission_no": "STU-0001",
  "class_id": 3,
  "class_name": "JSS1 A"
}
```

**Usage (frontend)**: call this when a search result is clicked to show the student details page (name, class, etc.).

---

### 3) Get student bills

- **Method**: `GET`
- **Path**: `/api/students/:id/bills`
- **Query params**:
  - `termId` (number, optional) – filter bills by a specific term.
- **Example**:

```http
GET /api/students/12/bills?termId=5
Host: localhost:5000
```

- **Example response** (`200 OK`):

```json
[
  {
    "id": 101,
    "description": "School fees 1st Term 2025/2026",
    "amount": 50000,
    "due_date": "2025-10-01",
    "term_name": "1st Term",
    "session": "2025/2026",
    "amount_paid": 30000,
    "status": "PARTIALLY_PAID"
  }
]
```

- `status` can be:
  - `"PAID"`
  - `"UNPAID"`
  - `"PARTIALLY_PAID"`

**Usage (frontend)**:

- Use this for the **“Student Bill”** dialog:
  - Show description, full amount, amount paid, outstanding amount.
  - Show a color-coded status badge.
  - Wire “Pay Bill” button to your payment flow (Remita integration).

---

### 4) Get student term report

- **Method**: `GET`
- **Path**: `/api/students/:id/report`
- **Query params**:
  - `termId` (number, required) – the term to get the report for.
- **Example**:

```http
GET /api/students/12/report?termId=5
Host: localhost:5000
```

- **Example response** (`200 OK`):

```json
{
  "id": 88,
  "term_id": 5,
  "term_name": "1st Term",
  "session": "2025/2026",
  "overall_comment": "Excellent performance.",
  "position_in_class": 2,
  "total_score": 780,
  "average_score": 78,
  "created_at": "2025-11-05T10:00:00.000Z"
}
```

**Usage (frontend)**:

- Use this for the **“Report”** view/download:
  - Render a report card UI with term, session, scores, position, and comments.
  - Combine with bills endpoint to show fee payment status on the report if needed.

---

## Notes for frontend engineers

- **Format**: all endpoints return **JSON** (both success and error).
- **Base URL (dev)**: `http://localhost:5000`.
- **Usage pattern**:
  - Configure a base API URL in Flutter/React.
  - Append paths like `/api/students/search` or `/api/students/:id/bills`.
  - Always check HTTP status and handle non-2xx responses gracefully.

Planned (not yet implemented here but recommended):

- Payment initiation endpoint for Remita and a webhook to update `payments` status.
- Authenticated admin routes for managing students, classes, terms, and reports.

