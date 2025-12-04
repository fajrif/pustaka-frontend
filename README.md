# PustakaDB - Books Library Management System

Sistem manajemen buku dan penerbit (publishers), serta monitoring penjualan (Sales) dengan Golang (Fiber) backend + PostgreSQL + React (Vite) + TailwindCSS frontend.

## 🚀 Tech Stack

### Backend
- **Golang** - Programming language
- **Fiber** - Web framework
- **PostgreSQL** - Database
- **GORM** - ORM
- **JWT** - Authentication

### Frontend
- **React 18** - UI Library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Query** - Data fetching
- **React Router** - Routing
- **Recharts** - Charts
- **date-fns** - Date utilities
- **Axios** - HTTP client

## 📋 Prerequisites

Sebelum memulai, pastikan Anda telah menginstall:
- Go 1.21 atau lebih tinggi
- PostgreSQL 15 atau lebih tinggi
- Node.js 18 atau lebih tinggi
- npm atau yarn

# PustakaDB Frontend

Frontend aplikasi PustakaDB menggunakan Vite + React + Tailwind CSS

## Requirements

- Node.js >= 18
- Backend API (Golang + PostgreSQL) running di `http://localhost:8080`

## Installation & Setup

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env dan sesuaikan VITE_API_BASE_URL

# Run development server
npm run dev

# Build for production
npm run build
```

## 🔧 Setup Backend

1. **Clone repository**
```bash
git clone <repository-url>
cd pustaka-backend
```

### Default Credentials
Admin: admin@pustaka.co.id / admin123
User: user@pustaka.co.id / user123
