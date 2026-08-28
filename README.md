# SHELTR.AI 🏛️⚡
> **Climate-Adaptive Shelter Design, Optimization & 3D Geospatial System**  
> *Developed for Smart India Hackathon (SIH 2026)*

[![Node.js Version](https://img.shields.io/badge/Node.js-v14%2B-green.svg)](https://nodejs.org)
[![GIS Engine](https://img.shields.io/badge/Map-Leaflet.js%20%7C%20MapTiler-blue.svg)](https://maptiler.com)
[![3D Engine](https://img.shields.io/badge/3D-Three.js%20WebGL-orange.svg)](https://threejs.org)
[![Weather API](https://img.shields.io/badge/Live%20Weather-Open--Meteo-teal.svg)](https://open-meteo.com)
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)](LICENSE)

---

## 📌 Executive Summary

**SHELTR.AI** is a disaster-resilient, climate-adaptive shelter design and geospatial optimization application engineered for **Government Departments, Disaster Management Authorities (NDMA/SDMA), Architects, Structural Engineers, DRDO/Research Organizations, NGOs, and Housing Authorities**.

When cyclones, floods, heatwaves, or earthquakes strike a region, planning teams need to rapidly configure shelters tailored to micro-environmental hazards. **SHELTR.AI** integrates live meteorological observations, site-level elevation data, point-in-polygon administrative boundary matching, thermal comfort metrics (Steadman 5-component breakdown), multi-objective parametric optimization, and real-time WebGL 3D architectural shelter visualization into a unified engineering decision-support platform.

---

## 🛠️ Tech Stack

SHELTR.AI is built using a clean, zero-external-npm-dependency architecture for maximum stability, fast startup, and high reliability in emergency situations.

### Backend & REST API Gateway
* **Runtime**: Node.js (v14+ standard HTTP server architecture).
* **Architecture**: Modular service layer with clean interfaces:
  * `locationService.js`: Point-in-polygon containment detection & city database.
  * `climateService.js`: Multi-location Open-Meteo batch API fetcher with 15-minute caching and offline demo fallbacks.
  * `elevationService.js`: Site-specific elevation provider querying Open-Meteo Elevation API.
  * `thermalService.js`: Steadman 5-component thermal comfort calculation engine.
  * `designEngine.js`: Multi-objective weighted design optimization & trigger-based recommendation engine.
  * `materialService.js`: Embodied carbon, thermal mass, and local availability evaluation matrix.
  * `aiService.js`: Context-bound, deterministic engineering assistant.
  * `reportService.js`: Server-side printable HTML engineering report generator.

### Geospatial & Mapping Pipeline
* **Map Renderer**: **Leaflet.js** (`v1.9.4`) with customized dark glassmorphism styling.
* **Base Map Tile Providers**: **MapTiler** vector/raster basemaps with automatic fallback to OpenStreetMap / Esri Dark Canvas.
* **Administrative Boundaries**: 100% validated GeoJSON FeatureCollection covering all **36 Indian States & Union Territories** with strict `[longitude, latitude]` coordinate ordering.
* **Geospatial Algorithms**: Custom ray-casting **Point-in-Polygon** algorithm supporting complex `Polygon` and `MultiPolygon` geometries (including island chains and coastal buffers).
* **Live Weather Data**: **Open-Meteo API** (keyless, live observed weather for temperature, relative humidity, wind speed, precipitation, solar radiation, and 24-hour diurnal forecasts).

### 3D Parametric Shelter Studio
* **3D Renderer**: **Three.js** (WebGL context with PCF soft shadows, directional light vectors, and orbit controls).
* **Architectural Geometry Engine**: Dynamic construction of building components:
  * **Foundations & Support Stilts**: Raised floor deck on heavy support posts for flood/water risk mitigation.
  * **Structural Framing**: Corner posts, floor plates, top-plate framing, and segment-cut wall panels.
  * **Roof Geometries**: Insulated flat slab, sloped gable roof with exposed ridge/rafters, and double-roof system with visible air-gap.
  * **Shading & Ventilation Devices**: Operable window cutouts, high-level clerestory louvers, horizontal window shades, vertical brise-soleil shading fins, and adjustable overhang projection eaves (0.2m to 2.2m).
  * **Material Shaders**: Customized WebGL standard materials for Compressed Earth Block (CEB), Bamboo Composite, and Insulated Steel Panels.
  * **Climate Vector Simulations**: Moving sun solar path vector, animated cross-ventilation airflow particles, and rain runoff streams.

### Frontend UI & Analytics
* **UI Framework**: Native Vanilla ES6 Modules & HTML5/CSS3 with glassmorphism visual identity.
* **Data Visualization**: **Chart.js** for 24-hour diurnal temperature and relative humidity forecasting.

---

## 🔄 End-to-End Product Pipeline

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  1. Location    │ ──> │ 2. Environment   │ ──> │ 3. Site Risk     │
│  Map / Search   │     │  Open-Meteo API  │     │  & Hazards       │
└─────────────────┘     └──────────────────┘     └──────────────────┘
         │                                                 │
         ▼                                                 ▼
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ 6. 3D WebGL     │ <── │ 5. Optimization  │ <── │ 4. Thermal       │
│ Shelter Studio  │     │ & Recommendations│     │ Comfort Engine   │
└─────────────────┘     └──────────────────┘     └──────────────────┘
         │
         ├──> 7. Interactive Before/After Design Comparison
         ├──> 8. Printable Engineering HTML Report
         └──> 9. AI Engineering Assistant
```

1. **Location Selection**: Pick any state/UT polygon on the map, select major cities, or input exact custom coordinates (`lat, lng`).
2. **Geospatial & Point-in-Polygon**: Ray-casting algorithm detects the exact containing State and fetches site-specific elevation.
3. **Meteorological Data Retrieval**: Fetches live observed weather (temp, RH, wind, rain, solar, 24h forecast) from Open-Meteo.
4. **Thermal Comfort & Risk Engine**: Evaluates heat stress, wind exposure, flood risks, and 5-component thermal comfort.
5. **Multi-Objective Optimization**: Recommends roof type, overhang length, raised floor height, window openings, shading devices, and wall materials.
6. **Parametric 3D Generation**: Synthesizes a WebGL 3D architectural building model matching exact engineering recommendations.
7. **Exploration & Reporting**: Allows real-time "What-If?" parameter overrides, before/after metric comparisons, printable PDF/HTML report exports, and interactive AI Q&A.

---

## ⚙️ Environment Configuration (`.env`)

Create a `.env` file in the root directory (refer to `.env.example`):

```env
PORT=4174

# Map Provider Options: maptiler, mapbox, carto, openstreetmap, esri
MAP_PROVIDER=maptiler
MAP_API_KEY=YOUR_MAPTILER_API_KEY_HERE

# Weather & Elevation Providers: open_meteo, demo
WEATHER_PROVIDER=open_meteo
ELEVATION_PROVIDER=open_meteo
```

> **Note**: If `MAP_API_KEY` is omitted or unconfigured, SHELTR.AI automatically falls back to OpenStreetMap / Carto Dark canvas tiles cleanly without displaying watermark errors.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v14.0.0 or higher).
* Any modern browser supporting WebGL (Chrome, Firefox, Edge, Safari).

### Quick Start
1. **Clone the repository**:
   ```bash
   git clone https://github.com/Kailasnath-RR/SIH-2026.git
   cd SIH-2026
   ```

2. **Configure environment variables (optional)**:
   ```bash
   cp .env.example .env
   ```

3. **Start the SHELTR.AI server**:
   ```bash
   node server.js
   ```

4. **Open in browser**:
   Navigate to `http://localhost:4174` in your browser.

---

## 📡 REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `GET /api/status` | `GET` | Health check & system mode status. |
| `GET /api/config` | `GET` | Returns public frontend map and provider configuration. |
| `GET /api/climate/states` | `GET` | Returns 36-state live Open-Meteo weather batch data. |
| `GET /api/terrain/elevation` | `GET` | Queries real site-specific elevation (`?lat=...&lng=...`). |
| `GET /api/location/search` | `GET` | Searches city, state, or custom lat/lng coordinates (`?q=...`). |
| `GET /api/climate` | `GET` | Returns current weather conditions for selected location. |
| `GET /api/climate/hourly` | `GET` | Returns 24-hour diurnal weather forecast. |
| `POST /api/design/analyze` | `POST` | Runs thermal comfort analysis and weighted design optimization. |
| `POST /api/assistant` | `POST` | Interrogates context-bound AI engineering assistant. |
| `POST /api/report` | `POST` | Generates a printable engineering HTML report. |

---

## 🧪 Validation & Testing

To validate the GeoJSON geometry integrity for all 36 Indian States & UTs:
```bash
node scripts/validate-geojson.js
```

---

## 📄 License

This project is open-source under the **MIT License**.
