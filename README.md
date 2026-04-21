# AirWatch

AirWatch is a web app for checking air quality in Almaty. It has an Angular frontend and a Django REST Framework backend with JWT authentication.

## Team Members

| Name | Role |
|---|---|
| Abish Nuralim | Backend Developer |
| Shakirbek Amina | Full-Stack + QA Tester |
| Omarkhanov Sanzhar | Frontend Developer |

## Features

- Dashboard with AQI, PM2.5, PM10, and district data
- Map page with air quality locations and filters
- Suggestions page for creating and saving air-quality advice
- Login/logout with JWT tokens
- Protected API endpoints for authenticated users
- Error handling for frontend and backend requests

## Tech Stack

- Frontend: Angular, Angular Router, HttpClient, Forms
- Backend: Django, Django REST Framework, Simple JWT
- Database: SQLite
- CORS: django-cors-headers

## Project Structure

```text
frontend/   Angular application
backend/    Django API
```

Main frontend files:

- `frontend/src/app/app.routes.ts`
- `frontend/src/app/core/services/`
- `frontend/src/app/features/dashboard/`
- `frontend/src/app/features/map/`
- `frontend/src/app/features/cities/`
- `frontend/src/app/features/auth/`

Main backend files:

- `backend/apps/users/`
- `backend/apps/cities/`
- `backend/apps/air_quality/`
- `backend/config/settings.py`
- `backend/config/urls.py`

## Run Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Run Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:4200`.
Backend runs on `http://127.0.0.1:8000`.

## API/Auth

The backend uses JWT authentication with Simple JWT. After login, the frontend stores the access token and sends it in requests as:

```text
Authorization: Bearer <token>
```

## Main Requirements Covered

- Angular routes and navigation
- Click events and form controls
- `@if` and `@for`
- Angular services with `HttpClient`
- JWT authentication
- Django models, serializers, FBV, CBV
- CRUD operations for saved suggestions/cities
- CORS support
- Objects linked to the authenticated user
