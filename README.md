# 💰 RusWallet

> AI-Powered Personal Finance Management Application built with ASP.NET Core, React and OpenAI.

![.NET](https://img.shields.io/badge/.NET-8-512BD4?style=for-the-badge&logo=.net)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![SQL Server](https://img.shields.io/badge/SQL_Server-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai)
![ML.NET](https://img.shields.io/badge/ML.NET-512BD4?style=for-the-badge)

---

## 📖 About

RusWallet is an AI-powered personal finance management application developed as a Software Engineering graduation project.

The application enables users to manage their financial information securely, monitor their income and expenses, analyze spending habits, predict future financial trends, and receive personalized recommendations through Artificial Intelligence.

The project follows a layered architecture using ASP.NET Core Web API on the backend and React on the frontend.

---

# ✨ Features

## 👤 User Management

- User Registration
- Secure Login
- JWT Authentication
- Password Hashing
- User Profile Management

---

## 💸 Financial Management

- Income Tracking
- Expense Tracking
- Category Management
- Financial Summary
- Budget Overview

---

## 📊 Financial Analysis

- Spending Analysis
- Monthly Reports
- Financial Statistics
- Expense Distribution

---

## 🤖 Artificial Intelligence

- OpenAI Powered Financial Assistant
- Personalized Financial Recommendations
- AI Chat Support
- Intelligent Financial Insights

---

## 📈 Machine Learning

- Expense Prediction
- Future Spending Estimation
- Financial Trend Analysis using ML.NET

---

## 🔒 Security

- JWT Authentication
- Password Hashing
- Protected API Endpoints
- Secure Database Communication

---

# 🛠 Technologies

### Backend

- ASP.NET Core Web API
- C#
- Entity Framework Core
- SQL Server
- JWT Authentication
- OpenAI API
- ML.NET

### Frontend

- React
- React Native
- HTML5
- CSS3
- Bootstrap

### Database

- Microsoft SQL Server

### Tools

- Visual Studio
- Visual Studio Code
- Git
- GitHub
- Swagger

---

# 🏛 Architecture

```
                React / React Native
                        │
                        ▼
             ASP.NET Core Web API
                        │
        ┌───────────────┼───────────────┐
        ▼                               ▼
 Business Services             OpenAI API
        │
        ▼
   Entity Framework Core
        │
        ▼
     SQL Server
        │
        ▼
       ML.NET
```

---

# 📁 Project Structure

```
RusWallet
│
├── backend
│   ├── RusWallet.API
│   ├── RusWallet.Core
│   └── RusWallet.Infrastructure
│
├── frontend
│
├── README.md
│
└── docs
```

---

# 🚀 Installation

Clone repository

```bash
git clone https://github.com/aleynatombas/RusWallet.git
```

Backend

```bash
cd backend

dotnet restore

dotnet ef database update

dotnet run
```

Frontend

```bash
cd frontend

npm install

npm start
```

---

# ⚙ Configuration

Update your **appsettings.json**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "YOUR_CONNECTION"
  },

  "Jwt": {
    "Key": "YOUR_SECRET_KEY"
  },

  "OpenAI": {
    "ApiKey": "YOUR_API_KEY"
  }
}
```

---

# 📷 Screenshots

> Add screenshots inside the `/docs` folder.

Example:

```
docs/

landing-page.png

dashboard.png

transactions.png

analysis.png

chatbot.png

mobile-home.png
```

---

# 📌 Future Improvements

- OCR Receipt Scanning
- Azure AI Integration
- Multi-language Support
- Advanced Financial Analytics
- Investment Recommendation Module
- Cloud Deployment
- Notification System

---

# 🎓 Graduation Project

**University**

Istanbul Gelisim University

**Department**

Software Engineering

**Project**

AI-Powered Personal Finance Management Application

---

# 👩‍💻 Developer

**Aleyna Tombaş**

GitHub

https://github.com/aleynatombas

LinkedIn

https://www.linkedin.com/in/aleynatombas

---

# ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.
