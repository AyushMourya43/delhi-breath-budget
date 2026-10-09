"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  Clock3,
  Info,
  Leaf,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type ActivityType = "commute" | "walk" | "run" | "cycle" | "outdoor-work";
type ProfileType = "adult" | "child" | "asthma" | "elderly" | "worker";

type TimeSlot = {
  time: string;
  hour: number;
  pm25: number;
};

type Recommendation = TimeSlot & {
  score: number;
  category: string;
  explanation: string;
};

const SAMPLE_SLOTS: TimeSlot[] = [
  { time: "6:00 AM", hour: 6, pm25: 42 },
  { time: "7:00 AM", hour: 7, pm25: 48 },
  { time: "8:00 AM", hour: 8, pm25: 67 },
  { time: "9:00 AM", hour: 9, pm25: 82 },
  { time: "10:00 AM", hour: 10, pm25: 96 },
  { time: "12:00 PM", hour: 12, pm25: 88 },
  { time: "3:00 PM", hour: 15, pm25: 105 },
  { time: "5:00 PM", hour: 17, pm25: 92 },
  { time: "6:00 PM", hour: 18, pm25: 76 },
  { time: "7:00 PM", hour: 19, pm25: 68 },
  { time: "9:00 PM", hour: 21, pm25: 61 },
];

const ACTIVITY_OPTIONS: {
  value: ActivityType;
  label: string;
  duration: number;
  exertion: number;
}[] = [
  { value: "commute", label: "Daily commute", duration: 45, exertion: 1 },
  { value: "walk", label: "Walking", duration: 30, exertion: 1 },
  { value: "run", label: "Running", duration: 30, exertion: 3 },
  { value: "cycle", label: "Cycling", duration: 45, exertion: 2 },
  {
    value: "outdoor-work",
    label: "Outdoor work",
    duration: 120,
    exertion: 2,
  },
];

const PROFILE_OPTIONS: { value: ProfileType; label: string }[] = [
  { value: "adult", label: "Healthy adult" },
  { value: "child", label: "Child" },
  { value: "asthma", label: "Asthma-sensitive" },
  { value: "elderly", label: "Older adult" },
  { value: "worker", label: "Outdoor worker" },
];

function getCategory(pm25: number) {
  if (pm25 <= 15) return "Lower sample reading";
  if (pm25 <= 35) return "Moderate sample reading";
  if (pm25 <= 55) return "Elevated sample reading";
  return "Higher sample reading";
}

function getRecommendationScore(
  slot: TimeSlot,
  activity: (typeof ACTIVITY_OPTIONS)[number],
  profile: ProfileType
) {
  const profileFactor: Record<ProfileType, number> = {
    adult: 1,
    child: 1.15,
    asthma: 1.3,
    elderly: 1.15,
    worker: 1.1,
  };

  const durationFactor = activity.duration / 30;
  const exertionFactor = activity.exertion;

  const relativeExposure =
    slot.pm25 * durationFactor * exertionFactor * profileFactor[profile];

  return {
    relativeExposure: Math.round(relativeExposure),
    score: Math.max(0, Math.round(100 - relativeExposure / 3)),
  };
}

export default function BestTimeRecommendations() {
  const [activity, setActivity] = useState<ActivityType>("walk");
  const [profile, setProfile] = useState<ProfileType>("adult");
  const [maxDuration, setMaxDuration] = useState(60);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const recommendations = useMemo(() => {
    const selectedActivity = ACTIVITY_OPTIONS.find(
      (item) => item.value === activity
    )!;

    return SAMPLE_SLOTS.filter(
      (slot) => selectedActivity.duration <= maxDuration
    )
      .map((slot): Recommendation => {
        const result = getRecommendationScore(
          slot,
          selectedActivity,
          profile
        );

        return {
          ...slot,
          score: result.score,
          category: getCategory(slot.pm25),
          explanation:
            slot.pm25 <= 55
              ? "Lower than the other sample readings available."
              : "A higher sample reading than the lowest available slots.",
        };
      })
      .sort((a, b) => a.pm25 - b.pm25)
      .slice(0, 3);
  }, [activity, profile, maxDuration]);

  const chosen = recommendations.find(
    (item) => item.time === selectedTime
  );

  return (
    <section className="panel best-time-panel" aria-labelledby="best-time-title">
      <div className="panel-heading">
        <div>
          <h2 id="best-time-title">
            <Sparkles size={20} />
            Smart best-time suggestions
          </h2>
          <p>Compare illustrative time slots before planning an activity.</p>
        </div>
        <span className="section-chip">DEMO</span>
      </div>

      <div className="best-time-warning">
        <Info size={18} />
        <p>
          These recommendations use fictional PM2.5 values. They are not
          live readings, health-risk predictions, or validated forecasts.
        </p>
      </div>

      <div className="best-time-controls">
        <label>
          Activity
          <select
            value={activity}
            onChange={(event) => {
              setActivity(event.target.value as ActivityType);
              setSelectedTime(null);
            }}
          >
            {ACTIVITY_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          User profile
          <select
            value={profile}
            onChange={(event) => {
              setProfile(event.target.value as ProfileType);
              setSelectedTime(null);
            }}
          >
            {PROFILE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Maximum duration
          <select
            value={maxDuration}
            onChange={(event) => {
              setMaxDuration(Number(event.target.value));
              setSelectedTime(null);
            }}
          >
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={120}>120 minutes</option>
          </select>
        </label>
      </div>

      <div className="best-time-list">
        {recommendations.map((item, index) => (
          <article className="best-time-card" key={item.time}>
            <div className="best-time-rank">
              {index === 0 ? <Leaf size={19} /> : <Clock3 size={19} />}
            </div>

            <div className="best-time-details">
              <div className="best-time-title-row">
                <h3>{item.time}</h3>
                {index === 0 && (
                  <span className="best-time-badge">Lowest sample PM2.5</span>
                )}
              </div>

              <p>{item.explanation}</p>

              <div className="best-time-reading">
                Sample PM2.5: <strong>{item.pm25} µg/m³</strong>
              </div>

              <div
                className="best-time-track"
                role="img"
                aria-label={`Relative sample reading ${item.pm25}`}
              >
                <span
                  style={{
                    width: `${Math.min(100, (item.pm25 / 150) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              className={
                selectedTime === item.time
                  ? "best-time-choose selected"
                  : "best-time-choose"
              }
              onClick={() =>
                setSelectedTime(
                  selectedTime === item.time ? null : item.time
                )
              }
            >
              {selectedTime === item.time ? "Selected" : "Choose"}
            </button>
          </article>
        ))}
      </div>

      {chosen && (
        <div className="best-time-result" role="status">
          <ShieldCheck size={21} />
          <div>
            <strong>Selected slot: {chosen.time}</strong>
            <p>
              You selected this slot for{" "}
              {ACTIVITY_OPTIONS.find((item) => item.value === activity)?.label}.
              Its illustrative PM2.5 reading is {chosen.pm25} µg/m³.
              This selection does not guarantee that the time is safe.
            </p>
          </div>
        </div>
      )}

      <div className="best-time-footer">
        <ArrowDownRight size={17} />
        <span>
          Rankings compare only the available sample values. Actual outdoor
          conditions can differ substantially.
        </span>
      </div>
    </section>
  );
}