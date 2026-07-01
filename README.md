# PlantGuard — AI Plant Disease Detection

A full-stack web application for detecting plant diseases using AI.

## Quick Start

### Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

## Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Multer

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scan` | Upload image for analysis |
| GET | `/api/diseases` | List all diseases (supports `?q=` and `?severity=`) |
| GET | `/api/diseases/:id` | Get disease by ID |
| GET | `/api/history` | Get scan history |
| DELETE | `/api/history/:id` | Delete a history entry |
