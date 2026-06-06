# VendorBridge

VendorBridge is a centralized ERP platform that digitizes procurement processes, including vendor management, RFQs, quotations, approvals, purchase orders, and invoices. It reduces manual effort, improves workflow efficiency, enables real-time tracking, and supports scalable, role-based operations.

## 🚀 Tech Stack

- **Frontend:** React.js, Vite, Chart.js, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Authentication:** JSON Web Tokens (JWT)
- **Other:** Multer (File Uploads), Nodemailer (Email Notifications)

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)

## 🛠️ Getting Started

Follow these instructions to set up the project locally.

### 1. Backend Setup

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd VendorBridge/backend
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables:
   Create a `.env` file in the `backend` directory and add the following required variables (use the provided `.env` if available):
   ```env
   PORT=5000
   MONGODB_URI=<Your MongoDB Connection String>
   JWT_SECRET=<Your JWT Secret>
   JWT_REFRESH_SECRET=<Your JWT Refresh Secret>
   JWT_EXPIRE=7d
   JWT_REFRESH_EXPIRE=30d
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=<Your Email Address>
   SMTP_PASS=<Your App Password>
   COMPANY_NAME="VendorBridge Corp"
   COMPANY_EMAIL="procurement@vendorbridge.com"
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will typically start on `http://localhost:5000`.*

### 2. Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd VendorBridge/frontend
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The frontend application will start on `http://localhost:5173`.*

## 📁 Project Structure

```text
VendorBridge/
├── backend/               # Node.js Express server
│   ├── config/            # Database and other configurations
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middlewares (auth, upload, etc.)
│   ├── models/            # Mongoose schemas
│   ├── routes/            # Express routes
│   ├── utils/             # Utility functions
│   └── server.js          # Entry point for backend
└── frontend/              # React frontend application
    ├── public/            # Static assets
    ├── src/               # React components, pages, and context
    └── vite.config.js     # Vite configuration
```
