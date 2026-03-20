# 🌍 Project 09 — AirWatch

A web-based system that monitors air quality in real time using public APIs. The platform provides users with up-to-date air pollution data, including key indicators such as PM2.5, PM10, and AQI, through a clean dashboard and interactive map.

---

## 👥 Group Members

| Name | Role |
|---|---|
| Abish Nuralim | — |
| Shakirbek Amina | — |
| Omarkhanov Sanzhar | — |

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular + TailwindCSS |
| Backend | Django + Django REST Framework |
| Database | PostgreSQL |
| Air Quality Data | OpenAQ Public API |

---

## 📁 Project Structure

airwatch/
├── frontend/          # Angular app
│   └── src/
│       ├── app/
│       │   ├── components/
│       │   │   ├── dashboard/
│       │   │   ├── map/
│       │   │   └── login/
│       │   ├── services/
│       │   └── app.routes.ts
│       └── index.html
└── backend/           # Django project
    ├── airquality/    # Django app
    ├── manage.py
    └── requirements.txt

---

## 🚀 Getting Started

### Frontend

cd frontend
npm install
ng serve

### Backend

cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

---

## 🌐 Data Sources

- OpenAQ — Real-time air quality data

---

## 📌 Key Features

- Real-time air quality dashboard (PM2.5, PM10, AQI)
- Interactive pollution map with Leaflet.js
- User authentication (login/logout with JWT)
- Ability to view and manage selected cities
- REST API powered by Django REST Framework
- Error handling and user-friendly interface