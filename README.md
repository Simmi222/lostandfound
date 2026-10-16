# Still Searching — AI-Powered Lost & Found System

Still Searching is an AI-driven platform designed to reconnect missing persons with their families. The application allows relatives to report missing loved ones, good samaritans to report sighted strangers, and users to search the database using facial recognition.

---

## Architecture Overview

The project is structured into three main components:

```
FaceMatch/
├── Frontend/           # React + Vite + TypeScript web interface
├── FaceMatchBackend/   # Django REST Framework backend API
└── face-matching-api/  # Serverless face encoding microservice (Modal)
```

---

## 1. Frontend

A modern, responsive web application built with React, Vite, and Framer Motion.

### Features
- **Story Feed**: Browse reported missing persons with status indicators (`MISSING` / `FOUND`).
- **Reporting Flow**:
  - **Relative / Family Member**: Detailed report for missing loved ones with traits, circumstances, and multiple photos.
  - **Sighted Stranger**: Quick sighting report for vulnerable or lost individuals seen in public places.
- **Biometric Photo Search**: Upload a photo or capture via camera to find matching cases with similarity scores and confirmation options (`Found` / `Not Found`).
- **Matched Showcase**: Side-by-side comparison of original report photos against sighted/matched photos with face similarity distance.
- **Family Dashboard**: Manage submitted reports, review sightings, and safely delete completed cases with custom confirmation modals.

### Tech Stack
- **Framework**: React 18 with TypeScript
- **Bundler**: Vite
- **Styling**: Vanilla CSS with custom theme variables
- **Animations**: Framer Motion
- **Deployment**: Vercel

### Setup & Running Locally
```bash
cd Frontend
npm install
npm run dev
```

Create a `.env` file in the `Frontend/` directory:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

---

## 2. Backend

A robust REST API built using Django and Django REST Framework.

### Features
- **Authentication**: JWT-based authentication (register, login, user sessions).
- **Report Management**: CRUD endpoints for missing reports and stranger sightings.
- **Face Matching Logic**: Compares 128-dimensional facial encodings using Euclidean distance to detect potential matches.
- **Status Automation**: Automatically updates case status from `MISSING` to `FOUND` upon match verification.
- **Media Handling**: Secure photo upload and storage support via Cloudinary or local media storage.

### Tech Stack
- **Language**: Python 3.10+
- **Framework**: Django 5.x & Django REST Framework
- **Database**: PostgreSQL (Production) / SQLite (Local development)
- **Authentication**: `djangorestframework-simplejwt`
- **Deployment**: Render

### Setup & Running Locally
```bash
cd FaceMatchBackend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

---

## 3. Face Recognition Microservice (Modal)

A serverless Python microservice dedicated to running deep learning face detection and 128-d vector embedding extraction without heavy system dependencies on the main backend.

### Features
- **Containerized Environment**: Pre-configured Debian container with `cmake`, `libopenblas`, and `dlib`.
- **Face Encoding**: Uses the `face_recognition` library to detect human faces and compute 128-d biometric vectors.
- **Secure Access**: Endpoint secured via API key authentication.

### Tech Stack
- **Platform**: Modal (`modal_app.py`)
- **Libraries**: `face-recognition`, `Pillow`, `numpy`, `FastAPI`

### Deploying to Modal
```bash
cd face-matching-api
pip install modal
modal setup
modal deploy modal_app.py
```

---

## Environment Configuration

Copy `.env.example` to `.env` in `FaceMatchBackend/` and configure your credentials:

| Variable | Description |
|---|---|
| `DJANGO_SECRET_KEY` | Secret key for Django |
| `DEBUG` | Set `True` for development, `False` for production |
| `ALLOWED_HOSTS` | Comma-separated list of permitted hostnames |
| `DATABASE_URL` | PostgreSQL connection string |
| `CORS_ALLOWED_ORIGINS` | Permitted frontend origins (e.g. Vercel URL) |
| `FACE_MATCH_API_KEY` | API key for Modal face recognition service |
| `FACE_MATCH_API_URL` | Modal function URL for encoding faces |
| `CLOUDINARY_URL` | Cloudinary storage connection string |

---

## License

This project is developed for social impact and reuniting families. Distributed under the MIT License.
