# Lost & Found Human Being — Backend

> An AI-powered platform to reconnect missing people with their relatives using facial recognition.

---

## Quick Start

### Prerequisites
- Python 3.10+ 
- Git
- Face encoding runs in Modal; the Django/Render service does not install `dlib`
  or `face_recognition`.

### 1. Clone and enter the project

```bash
git clone <your-repo-url>
cd FaceMatch/FaceMatchBackend
```

### 2. Create and activate virtual environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

> **Windows note**: Always run pip through the active environment (`python -m pip`), otherwise
> Windows may use a different global Python installation. `dlib` (required by
> Local face encoding is handled by the Modal service, so Render does not need
> CMake or the **Desktop development with C++** workload.
> from [Build Tools for Visual Studio](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022).
> Include the MSVC compiler, Windows SDK, and CMake tools during installation. After installing
> the workload, open a new PowerShell window, activate the environment again, and run:
> ```bash
> venv\Scripts\activate
> python -m pip install -r requirements.txt
> ```

### 4. Configure environment

```bash
cp .env.example .env
# Edit .env and set DJANGO_SECRET_KEY (and DATABASE_URL for PostgreSQL)
```

### 5. Run migrations

```bash
python manage.py migrate
```

### 6. Create a superuser (admin)

```bash
python manage.py createsuperuser
```

> Set `role = ADMIN` manually in the Django admin shell or admin panel after creation.

### 7. Start the dev server

```bash
python manage.py runserver
```

Backend runs at: http://127.0.0.1:8000

---

## API Reference

All endpoints are prefixed with `/api/`.

### Authentication

| Method | Endpoint | Auth Required | Description |
|--------|----------|--------------|-------------|
| POST | `/api/auth/register/` | No | Register a new RELATIVE or CONTRIBUTOR |
| POST | `/api/auth/login/` | No | Login with email + password |
| POST | `/api/auth/logout/` | Yes | Blacklist refresh token |
| POST | `/api/auth/token/refresh/` | No | Refresh access token |
| GET | `/api/auth/me/` | Yes | Get own profile |
| PATCH | `/api/auth/me/` | Yes | Update own profile |

#### Register body
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass123",
  "confirm_password": "securepass123",
  "role": "RELATIVE",
  "phone_number": "+1234567890",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### Login body
```json
{
  "email": "john@example.com",
  "password": "securepass123"
}
```

---

### Missing-Person Reports (RELATIVE role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/missing/` | List own missing reports |
| POST | `/api/reports/missing/` | Create a new missing report |
| GET | `/api/reports/missing/{id}/` | Get report detail |
| PATCH | `/api/reports/missing/{id}/update/` | Update report fields |
| POST | `/api/reports/missing/{id}/photos/` | Upload additional photos |
| POST | `/api/reports/missing/{id}/close/` | Close a report |

#### Create missing report (multipart/form-data)
```
kind: MISSING
name: Jane Doe
age: 32
gender: Female
last_seen_place: Central Park, NY
lost_or_found_date: 2026-10-01
description: Medium height, brown hair...
images: <file1.jpg> <file2.jpg>   ← multiple files
```

---

### Found / Sighted Person Reports (CONTRIBUTOR role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/found/` | List own found reports |
| POST | `/api/reports/found/` | Create a new found report |
| GET | `/api/reports/found/{id}/` | Get report detail |
| PATCH | `/api/reports/found/{id}/update/` | Update report fields |
| POST | `/api/reports/found/{id}/photos/` | Upload additional photos |

---

### My Reports (all roles)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/mine/` | All reports created by the caller |

---

### Matches & Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/matches/dashboard/` | Dashboard: reports + matches + unread count |
| GET | `/api/matches/mine/` | All matches involving caller's reports |
| GET | `/api/matches/{id}/` | Single match detail |
| POST | `/api/matches/search/` | Ad-hoc face search (upload a photo) |

> ⚠️ `face_distance` is an L2 similarity score, **not a probability**. All results are labeled `candidate_match: true` and require human verification.

---

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications/` | List all notifications for caller |
| POST | `/api/notifications/{id}/read/` | Mark one notification as read |
| POST | `/api/notifications/read-all/` | Mark all as read |

---

## User Roles

| Role | Can Do |
|------|--------|
| `RELATIVE` | Create missing reports, view matches, receive notifications |
| `CONTRIBUTOR` | Create found/sighted reports, view their match status |
| `ADMIN` | Manage all reports, verify matches, moderate content |

> Admin role is **server-side only** — it cannot be self-assigned via registration.

---

## Face Recognition

- Uses the Modal `face_recognition` service (dlib pretrained model)
- Generates 128-dimensional face embeddings per photo
- Stores embeddings as JSON in `ReportPhoto.face_encoding`
- Bidirectional matching: MISSING ↔ FOUND
- Configurable distance threshold via `FACE_MATCH_TOLERANCE` env var (default: 0.50)
- Every result is a **candidate only** — requires human verification
- No match is created if no face is detected (validation error returned)

---

## Project Structure

```
FaceMatchBackend/
├── Accounts/            # Custom user model, JWT auth
│   ├── models.py        # User (RELATIVE / CONTRIBUTOR / ADMIN)
│   ├── serializers.py   # Register, Login, Profile serializers
│   ├── views.py         # Register, Login, Logout, Me views
│   ├── permissions.py   # IsRelative, IsContributor, IsPlatformAdmin
│   └── urls.py
│
├── reports/             # Missing & Found person reports
│   ├── models.py        # PersonReport, ReportPhoto
│   ├── serializers.py   # Report serializers
│   ├── views.py         # CRUD + photo upload + close
│   ├── permissions.py   # IsReportOwner
│   └── urls.py
│
├── matching/            # Face recognition & match management
│   ├── models.py        # FaceMatch
│   ├── services.py      # Core face processing pipeline
│   ├── serializers.py   # FaceMatch serializer
│   ├── views.py         # Dashboard, MyMatches, Search
│   └── urls.py
│
├── notifications/       # In-app notification system
│   ├── models.py        # Notification
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
│
└── FaceMatchBackend/    # Django config
    ├── settings.py
    └── urls.py
```

---

## Environment Variables

See `.env.example` for all configuration keys.

| Variable | Default | Description |
|----------|---------|-------------|
| `DJANGO_SECRET_KEY` | insecure default | Django secret key |
| `DEBUG` | `True` | Debug mode |
| `DATABASE_URL` | SQLite | PostgreSQL connection URL |
| `CORS_ALLOWED_ORIGINS` | localhost:5173 | React dev server |
| `FACE_MATCH_TOLERANCE` | `0.50` | Face distance threshold |

---

## Development Phases

- ✅ Phase 1: Custom user model, JWT auth, role-based permissions
- ✅ Phase 2: Report CRUD, photo upload, ownership enforcement
- ✅ Phase 3: Face recognition pipeline, bidirectional matching
- ✅ Phase 4: Notifications app
- ✅ Phase 5: Dashboard API, match retrieval
- 🔜 Phase 6: React frontend, dashboards, forms
- 🔜 Phase 7: Real-time notifications (WebSockets/SSE)
- 🔜 Phase 8: Admin review interface, audit logs
- 🔜 Phase 9: Cloudinary integration, production deployment
