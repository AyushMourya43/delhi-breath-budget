"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  Flame,
  Gauge,
  MapPin,
  Menu,
  ShieldCheck,
  Wind,
  X,
} from "lucide-react";

const PollutionMap = dynamic(
  () => import("../components/map/PollutionMap"),
  {
    ssr: false,
    loading: () => (
      <div className="panel" style={{ padding: 32 }}>
        Loading interactive Delhi map...
      </div>
    ),
  }
);

const RouteComparison = dynamic(
  () => import("../components/routes/RouteComparison"),
  {
    ssr: false,
    loading: () => (
      <div className="panel" style={{ padding: 24 }}>
        Loading route planner...
      </div>
    ),
  }
);

const stations = [
  { name: "Anand Vihar", aqi: 225, pm25: 118 },
  { name: "Connaught Place", aqi: 165, pm25: 72 },
  { name: "Dwarka", aqi: 132, pm25: 54 },
  { name: "Rohini", aqi: 186, pm25: 83 },
  { name: "Lodhi Road", aqi: 108, pm25: 42 },
];

const hours = [
  { label: "Now", value: 118 },
  { label: "3 PM", value: 105 },
  { label: "6 PM", value: 92 },
  { label: "9 PM", value: 76 },
  { label: "12 AM", value: 68 },
  { label: "3 AM", value: 61 },
  { label: "6 AM", value: 73 },
  { label: "9 AM", value: 96 },
];

const profiles = [
  { value: "adult", label: "Healthy adult" },
  { value: "child", label: "Child" },
  { value: "asthma", label: "Asthma-sensitive" },
  { value: "elderly", label: "Older adult" },
  { value: "worker", label: "Outdoor worker" },
];

function aqiLabel(aqi: number) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Satisfactory";
  if (aqi <= 200) return "Moderate";
  if (aqi <= 300) return "Poor";
  if (aqi <= 400) return "Very poor";
  return "Severe";
}

export default function HomePage() {
  const [profile, setProfile] = useState("adult");
  const [activity, setActivity] = useState("commute");
  const [selectedHour, setSelectedHour] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const currentAQI = 225;

  const averagePM = Math.round(
    stations.reduce((sum, station) => sum + station.pm25, 0) /
      stations.length
  );

  const profileAdvice: Record<string, string> = {
    adult:
      "Consider reducing prolonged outdoor exertion while pollution levels remain elevated.",
    child:
      "Consider shorter outdoor activities and indoor alternatives when pollution is elevated.",
    asthma:
      "Consider following your clinician's asthma action plan and limiting exposure to polluted air.",
    elderly:
      "Consider avoiding prolonged strenuous outdoor activity during elevated pollution.",
    worker:
      "Consider practical exposure-reduction measures and suitable workplace protection.",
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-symbol">
            <Wind size={24} />
          </div>

          <div>
            <div className="brand-name">Delhi Breath Budget</div>
            <div className="brand-subtitle">
              PERSONAL AIR QUALITY INTELLIGENCE
            </div>
          </div>
        </div>

        <nav className={menuOpen ? "nav-links nav-open" : "nav-links"}>
          <a href="#overview" onClick={() => setMenuOpen(false)}>
            Overview
          </a>
          <a href="#map" onClick={() => setMenuOpen(false)}>
            Pollution map
          </a>
          <a href="#routes" onClick={() => setMenuOpen(false)}>
            Routes
          </a>
          <a href="#forecast" onClick={() => setMenuOpen(false)}>
            Forecast
          </a>
          <a href="/plan-my-day" onClick={() => setMenuOpen(false)}>
  Plan My Day
</a>
        </nav>

        <div className="header-location">
          <MapPin size={15} />
          <span>Delhi NCR</span>
          <span className="demo-pill">DEMO</span>
        </div>

        <button
          className="mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      <div className="dashboard" id="overview">
        <section className="welcome-row">
          <div>
            <div className="eyebrow">
              HACKATHON PROTOTYPE · DEMONSTRATION DATA
            </div>
            <h1>
              Make room for <span>better air.</span>
            </h1>
            <p>
              Understand your exposure. Choose your route. Plan your day.
            </p>
          </div>

          <div className="data-status">
            <span className="status-dot" />
            Illustrative data · Not live
          </div>
        </section>

        <div className="notice">
          <Activity size={18} />
          <div>
            <strong>You&apos;re viewing a demonstration</strong>
            <p>
              AQI readings, PM2.5 values, route scores and forecast values are
              sample data. Live data integration is not connected yet.
            </p>
          </div>
        </div>

        <section className="metric-grid">
          <article className="metric-card">
            <div className="metric-heading">
              <span>Sample city AQI</span>
              <div className="metric-icon red">
                <Gauge size={19} />
              </div>
            </div>

            <div className="metric-value">{currentAQI}</div>

            <div className="metric-bottom">
              <span className="status-badge red-badge">
                {aqiLabel(currentAQI)}
              </span>
              <span>Illustrative reading</span>
            </div>

            <div className="metric-track">
              <span
                style={{ width: "56%", background: "#ef4444" }}
              />
            </div>
          </article>

          <article className="metric-card">
            <div className="metric-heading">
              <span>Average sample PM2.5</span>
              <div className="metric-icon orange">
                <Wind size={19} />
              </div>
            </div>

            <div className="metric-value">
              {averagePM}
              <small> µg/m³</small>
            </div>

            <div className="metric-bottom">
              <span>Across 5 sample stations</span>
            </div>

            <div className="metric-track">
              <span
                style={{ width: "72%", background: "#f97316" }}
              />
            </div>
          </article>

          <article className="metric-card">
            <div className="metric-heading">
              <span>Monitoring locations</span>
              <div className="metric-icon teal">
                <MapPin size={19} />
              </div>
            </div>

            <div className="metric-value">{stations.length}</div>

            <div className="metric-bottom">
              <span>Fictional sample readings</span>
            </div>

            <div className="metric-track">
              <span
                style={{ width: "65%", background: "#0d9488" }}
              />
            </div>
          </article>

          <article className="metric-card">
            <div className="metric-heading">
              <span>Lower-score route</span>
              <div className="metric-icon green">
                <ArrowDownRight size={19} />
              </div>
            </div>

            <div className="metric-value">
              61
              <small> PM2.5 score</small>
            </div>

            <div className="metric-bottom">
              <span className="positive-label">Inner City Route</span>
              <span>Sample estimate</span>
            </div>

            <div className="metric-track">
              <span
                style={{ width: "38%", background: "#16a34a" }}
              />
            </div>
          </article>
        </section>

        <section className="main-grid">
          <div id="map">
            <PollutionMap />
          </div>

          <aside className="side-column">
            <article className="panel profile-panel">
              <div className="panel-heading">
                <div>
                  <h2>
                    <ShieldCheck size={19} />
                    Personalize guidance
                  </h2>
                  <p>Tailor suggestions to your activity</p>
                </div>
              </div>

              <label className="field-label" htmlFor="profile">
                Who is this for?
              </label>

              <select
                id="profile"
                value={profile}
                onChange={(event) => setProfile(event.target.value)}
              >
                {profiles.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <label className="field-label" htmlFor="activity">
                Planned activity
              </label>

              <select
                id="activity"
                value={activity}
                onChange={(event) => setActivity(event.target.value)}
              >
                <option value="commute">Daily commute</option>
                <option value="walk">Walking</option>
                <option value="run">Running</option>
                <option value="cycle">Cycling</option>
                <option value="work">Outdoor work</option>
              </select>

              <div className="profile-advice">
                <ShieldCheck size={18} />
                <p>{profileAdvice[profile]}</p>
              </div>

              <div className="selected-activity">
                Selected activity:{" "}
                <strong>{activity.replace("-", " ")}</strong>
              </div>
            </article>

            <article className="panel smoke-panel">
              <div className="panel-heading">
                <div>
                  <h2>
                    <Flame size={19} />
                    Smoke risk
                  </h2>
                  <p>Regional hotspot demonstration</p>
                </div>

                <span className="section-chip warning-chip">
                  DEMO
                </span>
              </div>

              <div className="risk-row">
                <div>
                  <span className="small-label">
                    Illustrative risk level
                  </span>
                  <strong>Moderate</strong>
                </div>

                <span className="risk-symbol">
                  <Flame size={22} />
                </span>
              </div>

              <div className="risk-detail">
                <Clock3 size={16} />
                <span>
                  No verified smoke-arrival forecast available.
                </span>
              </div>

              <p className="muted-note">
                Fire hotspots are fictional. Real smoke-risk assessment
                requires verified fire and wind data.
              </p>
            </article>
          </aside>
        </section>

        <section className="lower-grid">
          <div id="routes">
            <RouteComparison />
          </div>

          <article className="panel" id="forecast">
            <div className="panel-heading">
              <div>
                <h2>
                  <Activity size={19} />
                  Exposure outlook
                </h2>
                <p>Sample PM2.5 trend · Select a time</p>
              </div>

              <span className="section-chip">DEMO FORECAST</span>
            </div>

            <div className="forecast-summary">
              <div>
                <span className="small-label">Selected period</span>
                <strong>{hours[selectedHour].label}</strong>
              </div>

              <div>
                <span className="small-label">Sample PM2.5</span>
                <strong>
                  {hours[selectedHour].value}
                  <small> µg/m³</small>
                </strong>
              </div>
            </div>

            <div className="bar-chart">
              {hours.map((hour, index) => (
                <button
                  className={`bar-column ${
                    selectedHour === index ? "bar-selected" : ""
                  }`}
                  key={hour.label}
                  onClick={() => setSelectedHour(index)}
                  aria-label={`${hour.label}, sample PM2.5 ${hour.value}`}
                  aria-pressed={selectedHour === index}
                >
                  <span className="bar-value">{hour.value}</span>

                  <span
                    className="bar"
                    style={{
                      height: `${Math.max(
                        18,
                        (hour.value / 130) * 135
                      )}px`,
                      background:
                        hour.value > 100 ? "#ef8c67" : "#53b7a5",
                    }}
                  />

                  <span className="bar-label">{hour.label}</span>
                </button>
              ))}
            </div>

            <div className="forecast-note">
              <ArrowUpRight size={16} />
              <span>
                This is a sample trend, not a validated air-quality
                forecast.
              </span>
            </div>
          </article>
        </section>

        <section className="advice-section">
          <div className="advice-icon">
            <ShieldCheck size={22} />
          </div>

          <div className="advice-content">
            <span className="eyebrow">
              PERSONALIZED GUIDANCE · DEMO
            </span>

            <h2>A little planning can help reduce exposure.</h2>

            <p>
              {profileAdvice[profile]} For your selected activity (
              {activity}), compare conditions and consider lower-exposure
              alternatives where practical.
            </p>
          </div>

          <span className="advice-tag">Rule-based sample</span>
        </section>

        <footer className="footer">
          <div className="footer-brand">
            <Wind size={17} />
            Delhi Breath Budget
          </div>

          <p>
            Environmental awareness prototype · Sample data only ·
            Not medical advice
          </p>

          <span></span>
        </footer>
      </div>
    </main>
  );
}