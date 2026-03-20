# 🌍 Project 09 — Air Quality Monitoring & Pollution Prediction Agent

An AI-powered system that monitors air quality in real time and predicts pollution levels using machine learning models, integrating data from IoT sensors, satellites, and public APIs.

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
| ML / Forecasting | Python (LSTM, ARIMA, Prophet) |
| Air Quality Data | OpenAQ Public API |
| Task Queue | Celery (scheduled predictions) |

---

## 📁 Project Structure

```
air-quality/
├── frontend/          # Angular app
│   └── src/
│       ├── app/
│       │   ├── components/
│       │   │   ├── dashboard/
│       │   │   └── map/
│       │   ├── services/
│       │   └── app.routes.ts
│       └── index.html
└── backend/           # Django project
    ├── airquality/    # Django app
    ├── manage.py
    └── requirements.txt
```

---

## 🚀 Getting Started

### Frontend

```bash
cd frontend
npm install
ng serve
```

### Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

---

## 🌐 Data Sources

- [OpenAQ](https://openaq.org/) — Real-time air quality data
- [NASA EarthData](https://earthdata.nasa.gov/)
- [Sentinel-5P](https://sentinel.esa.int/web/sentinel/missions/sentinel-5p)

---

## 📌 Key Features

- Real-time air quality dashboard (PM2.5, PM10, CO2, AQI)
- Interactive pollution map with Leaflet.js
- ML-based forecasting of pollution trends
- Anomaly detection for sudden pollution spikes
- REST API powered by Django REST Framework
