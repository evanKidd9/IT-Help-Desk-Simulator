# 🛠️ IT Help Desk Ticket Simulator

A full-stack Help Desk Ticketing System built with **Flask**, **React**, and **SQLAlchemy**.

This project simulates the workflow of a real IT support environment where users can submit support tickets and technicians can manage, assign, and resolve them.

---

## 🚀 Features

### ✅ User Accounts
- Create an account and log in securely
- Submit IT support tickets with:
  - Title  
  - Description  
  - Priority level  

### ✅ Ticket Tracking
- Users can view all tickets they have created
- Tickets display:
  - Status (Open / In Progress / Complete)
  - Priority
  - Progress bar

### ✅ Technician Dashboard
Technicians have access to a dedicated portal where they can:

- View **all submitted tickets**
- Sort tickets by user
- Assign tickets to themselves before making edits
- Update:
  - Progress percentage
  - Priority level
- Automatically update ticket status:
  - 0% → Open  
  - 1–99% → In Progress  
  - 100% → Complete  

### ✅ Ticket Closing
- Technicians can close and delete tickets only when progress reaches **100%**

### ✅ Conversation Threads (Ticket Notes)
Each ticket contains a live message thread where:

- Users and technicians can communicate directly
- Messages include:
  - Author name + role
  - Timestamp
- Technicians may post **internal notes** visible only to techs

### ✅ Account Deletion
- Users and technicians can permanently delete their account
- Deletion also removes related ticket notes and ticket data

---

## 🧰 Tech Stack

| Layer        | Technology |
|-------------|------------|
| Frontend     | React.js |
| Backend      | Flask (Python) |
| Database     | SQLite |
| ORM          | SQLAlchemy |
| Auth         | JWT Tokens |
| API Requests | Fetch + JSON |
| Migrations   | Flask-Migrate |
| Styling      | Inline CSS (future improvements planned) |

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/IT-Help-Desk-Simulator.git
cd IT-Help-Desk-Simulator
```

### 2. Backend Setup: Create and run virtual environment
```
cd backend
python -m venv venv
venv\Scripts\activate
```

In the environment, install the backend dependencies listed in requirements.txt

To run the Flask server, run **python app.py**

### 3. Frontend Setup
In a second terminal, run:
```
cd frontend
npm install
npm start
```

## 🔐 Technician Accounts
To create a technician account, use the following invite code: **DEV-TECH-CODE**

