"use client";

import Link from "next/link";
import * as XLSX from "xlsx-js-style";

import { useMemo, useState } from "react";

import {

  Activity,

  ArrowLeft,

  CalendarDays,

  CheckCircle2,

  Clock3,

  Download,

  Leaf,

  Plus,

  ShieldCheck,

  Sparkles,

  Trash2,

  Wind,

  Info,

  TrendingDown,

} from "lucide-react";

import "./planner.css";

type ActivityType = "commute" | "walk" | "run" | "cycle" | "work";

type Profile = "adult" | "child" | "asthma" | "elderly" | "worker";

type TimeSlot = {

  id: string;

  label: string;

  hour: number;

  pm25: number;

};

type PlannedActivity = {

  id: number;

  type: ActivityType;

  title: string;

  timeSlotId: string;

  duration: number;

};

type ActivityOption = {

  value: ActivityType;

  label: string;

  description: string;

  defaultDuration: number;

  exertion: number;

};

type RankedSlot = TimeSlot & {

  exposureIndex: number;

  rankScore: number;

  reason: string;

};

const timeSlots: TimeSlot[] = [

  { id: "6am", label: "6:00 AM", hour: 6, pm25: 73 },

  { id: "9am", label: "9:00 AM", hour: 9, pm25: 96 },

  { id: "12pm", label: "12:00 PM", hour: 12, pm25: 118 },

  { id: "3pm", label: "3:00 PM", hour: 15, pm25: 105 },

  { id: "6pm", label: "6:00 PM", hour: 18, pm25: 92 },

  { id: "9pm", label: "9:00 PM", hour: 21, pm25: 76 },

];

const activityOptions: ActivityOption[] = [

  {

    value: "commute",

    label: "Daily commute",

    description: "Travel to college or work",

    defaultDuration: 45,

    exertion: 1,

  },

  {

    value: "walk",

    label: "Walking",

    description: "A walk or outdoor errand",

    defaultDuration: 30,

    exertion: 1,

  },

  {

    value: "run",

    label: "Running",

    description: "Outdoor exercise",

    defaultDuration: 30,

    exertion: 3,

  },

  {

    value: "cycle",

    label: "Cycling",

    description: "Cycling or an outdoor ride",

    defaultDuration: 40,

    exertion: 2,

  },

  {

    value: "work",

    label: "Outdoor work",

    description: "Work that requires outdoor time",

    defaultDuration: 60,

    exertion: 2,

  },

];

const profiles: { value: Profile; label: string }[] = [

  { value: "adult", label: "Healthy adult" },

  { value: "child", label: "Child" },

  { value: "asthma", label: "Asthma-sensitive person" },

  { value: "elderly", label: "Older adult" },

  { value: "worker", label: "Outdoor worker" },

];

const profileGuidance: Record<Profile, string> = {

  adult:

    "Consider reducing prolonged outdoor exertion when pollution is elevated. Compare available time slots before planning optional outdoor activities.",

  child:

    "Consider shorter outdoor activities and indoor alternatives when pollution is elevated. Children may be more sensitive to air pollution.",

  asthma:

    "Consider following your clinician's asthma action plan and limiting exposure when pollution is elevated.",

  elderly:

    "Consider avoiding prolonged strenuous outdoor activity during elevated pollution and taking breaks as needed.",

  worker:

    "Consider practical exposure-reduction measures, suitable workplace protection, and indoor breaks where possible.",

};

const profileFactors: Record<Profile, number> = {

  adult: 1,

  child: 1.15,

  asthma: 1.3,

  elderly: 1.15,

  worker: 1.1,

};

function getSlot(id: string): TimeSlot {

  return timeSlots.find((slot) => slot.id === id) ?? timeSlots[0];

}

function getPollutionLabel(pm25: number) {

  if (pm25 <= 15) return "Lower sample reading";

  if (pm25 <= 35) return "Moderate sample reading";

  if (pm25 <= 55) return "Elevated sample reading";

  if (pm25 <= 75) return "Relatively lower sample reading";

  if (pm25 <= 100) return "Higher sample reading";

  return "Highest sample reading in this dataset";

}

function getDurationLabel(minutes: number) {

  if (minutes < 60) return `${minutes} minutes`;

  const hours = Math.floor(minutes / 60);

  const remaining = minutes % 60;

  return remaining > 0

    ? `${hours} hr ${remaining} min`

    : `${hours} ${hours === 1 ? "hour" : "hours"}`;

}

function getActivityRecommendations(

  activityType: ActivityType,

  profile: Profile,

  duration: number

): RankedSlot[] {

  const activity = activityOptions.find(

    (item) => item.value === activityType

  )!;

  return timeSlots

    .map((slot) => {

      const exposureIndex =

        slot.pm25 *

        (duration / 60) *

        activity.exertion *

        profileFactors[profile];

      let reason =

        "This slot has a lower sample PM2.5 reading than the other available times.";

      if (slot.pm25 <= 75) {

        reason =

          "This is among the lower sample readings available for comparison.";

      }

      if (activity.exertion >= 3 && slot.pm25 > 75) {

        reason =

          "This slot has a higher sample reading; consider indoor exercise or postponing strenuous activity.";

      }

      if (profile === "asthma" && slot.pm25 > 75) {

        reason =

          "For this asthma-sensitive profile, consider reducing outdoor exposure and following your clinician's guidance.";

      } else if (

        (profile === "child" || profile === "elderly") &&

        slot.pm25 > 75

      ) {

        reason =

          "Consider a shorter activity or an indoor alternative when conditions are elevated.";

      }

      return {

        ...slot,

        exposureIndex,

        rankScore: Math.round(exposureIndex * 100) / 100,

        reason,

      };

    })

    .sort((a, b) => a.rankScore - b.rankScore);

}

export default function PlanMyDayPage() {

  const [profile, setProfile] = useState<Profile>("adult");

  const [activityType, setActivityType] =

    useState<ActivityType>("commute");

  const [timeSlotId, setTimeSlotId] = useState("9am");

  const [duration, setDuration] = useState(45);

  const [plannedActivities, setPlannedActivities] = useState<

    PlannedActivity[]

  >([]);

  const [nextId, setNextId] = useState(1);

  const [notice, setNotice] = useState("");

  const selectedSlot = getSlot(timeSlotId);

  const rankedSlots = useMemo(

    () => getActivityRecommendations(activityType, profile, duration),

    [activityType, profile, duration]

  );

  const bestSlots = rankedSlots.slice(0, 3);

  const dailyMinutes = plannedActivities.reduce(

    (total, item) => total + item.duration,

    0

  );

  const estimatedExposure = plannedActivities.reduce(

    (total, item) => {

      const slot = getSlot(item.timeSlotId);

      return total + (slot.pm25 * item.duration) / 60;

    },

    0

  );

  const averagePlannedPM25 =

    dailyMinutes > 0

      ? Math.round(

          plannedActivities.reduce(

            (total, item) =>

              total + getSlot(item.timeSlotId).pm25 * item.duration,

            0

          ) / dailyMinutes

        )

      : 0;

  function addActivity() {

    if (

      !Number.isFinite(duration) ||

      duration < 5 ||

      duration > 480

    ) {

      setNotice("Choose a duration between 5 and 480 minutes.");

      return;

    }

    const activity = activityOptions.find(

      (item) => item.value === activityType

    );

    if (!activity) return;

    setPlannedActivities((current) => [

      ...current,

      {

        id: nextId,

        type: activityType,

        title: activity.label,

        timeSlotId,

        duration,

      },

    ]);

    setNextId((id) => id + 1);

    setNotice(`${activity.label} added to your daily plan.`);

  }

  function removeActivity(id: number) {

    setPlannedActivities((current) =>

      current.filter((item) => item.id !== id)

    );

    setNotice("Activity removed from your plan.");

  }

  function chooseSuggestedTime(slotId: string) {

    setTimeSlotId(slotId);

    setNotice(`Selected suggested time: ${getSlot(slotId).label}.`);

  }

  function updateActivityType(value: ActivityType) {

    setActivityType(value);

    const option = activityOptions.find(

      (item) => item.value === value

    );

    if (option) setDuration(option.defaultDuration);

    setNotice("");

  }

  function exportPlan() {
    try {
      const exportedAt = new Date();
      const dateStamp = [
        exportedAt.getFullYear(),
        String(exportedAt.getMonth() + 1).padStart(2, "0"),
        String(exportedAt.getDate()).padStart(2, "0"),
      ].join("-");
  
      const exportedTime = new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "medium",
      }).format(exportedAt);
  
      const selectedProfile =
        profiles.find((item) => item.value === profile)?.label ?? profile;
  
      const sortedActivities = [...plannedActivities].sort(
        (a, b) => getSlot(a.timeSlotId).hour - getSlot(b.timeSlotId).hour
      );
  
      const rows: (string | number)[][] = [
        ["DELHI BREATH BUDGET — DAILY ACTIVITY PLAN"],
        ["Personal air-quality planner | Demonstration data only"],
        [],
        ["PLAN INFORMATION"],
        ["EXPORTED AT", exportedTime],
        ["DATA STATUS", "Illustrative sample data — not live"],
        ["USER PROFILE", selectedProfile],
        [],
        ["ACTIVITY SCHEDULE"],
        [
          "ACTIVITY",
          "SCHEDULED TIME",
          "DURATION (MINUTES)",
          "SAMPLE PM2.5 (µg/m³)",
          "READING DESCRIPTION",
        ],
      ];
  
      if (sortedActivities.length === 0) {
        rows.push([
          "No activities added",
          "—",
          0,
          "—",
          "Add activities to your plan before exporting",
        ]);
      } else {
        sortedActivities.forEach((item) => {
          const slot = getSlot(item.timeSlotId);
          rows.push([
            item.title,
            slot.label,
            item.duration,
            slot.pm25,
            getPollutionLabel(slot.pm25),
          ]);
        });
      }
  
      rows.push(
        [],
        ["PLAN SUMMARY"],
        ["NUMBER OF ACTIVITIES", plannedActivities.length],
        ["TOTAL PLANNED DURATION (MINUTES)", dailyMinutes],
        [
          "DURATION-WEIGHTED SAMPLE PM2.5 (µg/m³)",
          plannedActivities.length > 0 ? averagePlannedPM25 : "N/A",
        ],
        [],
        ["DISCLAIMER"],
        [
          "NOTE",
          "All readings are illustrative and do not represent current air quality or medical advice.",
        ],
        [],
        ["SUGGESTED TIME SLOTS FOR CURRENT SELECTIONS"],
        [
          "RANK",
          "TIME",
          "SAMPLE PM2.5 (µg/m³)",
          "RELATIVE EXPOSURE INDEX (ILLUSTRATIVE)",
          "RECOMMENDATION",
        ]
      );
  
      bestSlots.forEach((slot, index) => {
        rows.push([
          index + 1,
          slot.label,
          slot.pm25,
          Math.round(slot.exposureIndex * 100) / 100,
          slot.reason,
        ]);
      });
  
      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      worksheet["!cols"] = [
        { wch: 36 },
        { wch: 22 },
        { wch: 24 },
        { wch: 25 },
        { wch: 76 },
      ];
      worksheet["!rows"] = rows.map((_, index) => ({
        hpt: index === 0 ? 34 : index === 1 ? 24 : 23,
      }));
  
      const navy = "17324D";
      const teal = "DDF3EF";
      const lightGray = "F1F5F9";
      const white = "FFFFFF";
      const darkText = "1F2937";
      const borderColor = "D8E1E8";
  
      const cellBorder = {
        top: { style: "thin", color: { rgb: borderColor } },
        bottom: { style: "thin", color: { rgb: borderColor } },
        left: { style: "thin", color: { rgb: borderColor } },
        right: { style: "thin", color: { rgb: borderColor } },
      };
  
      Object.keys(worksheet).forEach((address) => {
        if (address.startsWith("!")) return;
        const cell = worksheet[address];
        cell.s = {
          font: { name: "Aptos", sz: 10, color: { rgb: darkText } },
          alignment: { vertical: "center", wrapText: true },
          border: cellBorder,
        };
        if (typeof cell.v === "number") {
          cell.s.alignment = {
            horizontal: "right",
            vertical: "center",
            wrapText: true,
          };
        }
      });
  
      worksheet["A1"].s = {
        fill: { patternType: "solid", fgColor: { rgb: navy } },
        font: {
          name: "Aptos Display",
          bold: true,
          sz: 18,
          color: { rgb: white },
        },
        alignment: { horizontal: "left", vertical: "center" },
      };
      worksheet["A2"].s = {
        fill: { patternType: "solid", fgColor: { rgb: navy } },
        font: { italic: true, sz: 10, color: { rgb: white } },
        alignment: { vertical: "center" },
      };
  
      const sectionTitles = new Set([
        "PLAN INFORMATION",
        "ACTIVITY SCHEDULE",
        "PLAN SUMMARY",
        "DISCLAIMER",
        "SUGGESTED TIME SLOTS FOR CURRENT SELECTIONS",
      ]);
      const sectionRows: number[] = [];
      const tableHeaderRows: number[] = [];
  
      rows.forEach((row, rowIndex) => {
        if (sectionTitles.has(String(row[0] ?? ""))) {
          sectionRows.push(rowIndex);
        }
        if (row[0] === "ACTIVITY" || row[0] === "RANK") {
          tableHeaderRows.push(rowIndex);
        }
      });
  
      sectionRows.forEach((rowIndex) => {
        const address = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
        if (worksheet[address]) {
          worksheet[address].s = {
            fill: { patternType: "solid", fgColor: { rgb: teal } },
            font: { bold: true, sz: 11, color: { rgb: navy } },
            alignment: { vertical: "center" },
            border: cellBorder,
          };
        }
      });
  
      tableHeaderRows.forEach((rowIndex) => {
        for (let col = 0; col < 5; col++) {
          const address = XLSX.utils.encode_cell({ r: rowIndex, c: col });
          if (worksheet[address]) {
            worksheet[address].s = {
              fill: { patternType: "solid", fgColor: { rgb: lightGray } },
              font: { bold: true, sz: 10, color: { rgb: navy } },
              alignment: {
                horizontal: "center",
                vertical: "center",
                wrapText: true,
              },
              border: cellBorder,
            };
          }
        }
      });
  
      rows.forEach((row, rowIndex) => {
        const label = String(row[0] ?? "");
        if (
          [
            "EXPORTED AT",
            "DATA STATUS",
            "USER PROFILE",
            "NUMBER OF ACTIVITIES",
            "TOTAL PLANNED DURATION (MINUTES)",
            "DURATION-WEIGHTED SAMPLE PM2.5 (µg/m³)",
            "NOTE",
          ].includes(label)
        ) {
          const address = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
          if (worksheet[address]) {
            worksheet[address].s = {
              fill: { patternType: "solid", fgColor: { rgb: lightGray } },
              font: { bold: true, color: { rgb: navy }, sz: 10 },
              alignment: { vertical: "center", wrapText: true },
              border: cellBorder,
            };
          }
        }
      });
  
      const merges: XLSX.Range[] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
        ...sectionRows.map((rowIndex) => ({
          s: { r: rowIndex, c: 0 },
          e: { r: rowIndex, c: 4 },
        })),
      ];
  
      const disclaimerIndex = rows.findIndex((row) => row[0] === "NOTE");
      if (disclaimerIndex >= 0) {
        merges.push({
          s: { r: disclaimerIndex, c: 1 },
          e: { r: disclaimerIndex, c: 4 },
        });
      }
  
      worksheet["!merges"] = merges;
      const activityHeaderIndex = rows.findIndex((row) => row[0] === "ACTIVITY");
      const activityEndRow = Math.max(
        activityHeaderIndex + 1,
        activityHeaderIndex + sortedActivities.length
      );
      worksheet["!autofilter"] = {
        ref: `A${activityHeaderIndex + 1}:E${activityEndRow + 1}`,
      };
      worksheet["!freeze"] = {
        xSplit: 0,
        ySplit: activityHeaderIndex + 1,
        topLeftCell: `A${activityHeaderIndex + 2}`,
        activePane: "bottomLeft",
        state: "frozen",
      };
  
      const suggestionsRows: (string | number)[][] = [
        ["SUGGESTED TIME SLOTS"],
        ["Ranked using illustrative sample readings"],
        [],
        [
          "RANK",
          "TIME",
          "SAMPLE PM2.5 (µg/m³)",
          "RELATIVE EXPOSURE INDEX",
          "RECOMMENDATION",
        ],
        ...bestSlots.map((slot, index) => [
          index + 1,
          slot.label,
          slot.pm25,
          Math.round(slot.exposureIndex * 100) / 100,
          slot.reason,
        ]),
        [],
        [
          "IMPORTANT",
          "These are demonstration values, not live measurements or a validated health-risk forecast.",
        ],
      ];
  
      const suggestionsSheet = XLSX.utils.aoa_to_sheet(suggestionsRows);
      suggestionsSheet["!cols"] = [
        { wch: 12 },
        { wch: 18 },
        { wch: 24 },
        { wch: 25 },
        { wch: 76 },
      ];
      suggestionsSheet["!rows"] = suggestionsRows.map((_, index) => ({
        hpt: index === 0 ? 32 : 24,
      }));
  
      Object.keys(suggestionsSheet).forEach((address) => {
        if (address.startsWith("!")) return;
        suggestionsSheet[address].s = {
          font: { name: "Aptos", sz: 10, color: { rgb: darkText } },
          alignment: { vertical: "center", wrapText: true },
          border: cellBorder,
        };
      });
  
      suggestionsSheet["A1"].s = {
        fill: { patternType: "solid", fgColor: { rgb: navy } },
        font: { bold: true, sz: 17, color: { rgb: white } },
        alignment: { vertical: "center" },
      };
      suggestionsSheet["A2"].s = {
        fill: { patternType: "solid", fgColor: { rgb: navy } },
        font: { italic: true, color: { rgb: white }, sz: 10 },
      };
  
      for (let col = 0; col < 5; col++) {
        const address = XLSX.utils.encode_cell({ r: 3, c: col });
        if (suggestionsSheet[address]) {
          suggestionsSheet[address].s = {
            fill: { patternType: "solid", fgColor: { rgb: lightGray } },
            font: { bold: true, color: { rgb: navy } },
            alignment: {
              horizontal: "center",
              vertical: "center",
              wrapText: true,
            },
            border: cellBorder,
          };
        }
      }
  
      suggestionsSheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
        {
          s: { r: suggestionsRows.length - 1, c: 1 },
          e: { r: suggestionsRows.length - 1, c: 4 },
        },
      ];
  
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Plan");
      XLSX.utils.book_append_sheet(workbook, suggestionsSheet, "Suggested Slots");
  
      XLSX.writeFile(workbook, `delhi-breath-budget-plan-${dateStamp}.xlsx`, {
        compression: true,
      });
  
      setNotice("Your formatted Excel workbook has been exported.");
    } catch (error) {
      console.error("Failed to export daily plan:", error);
      setNotice(
        "The Excel export failed. Please try again and check the browser console if the problem persists."
      );
    }
  }
  return (

    <main className="planner-page">

      <header className="planner-topbar">

        <Link href="/" className="planner-brand">

          <span className="planner-brand-icon">

            <Wind size={23} />

          </span>

          <span>

            <strong>Delhi Breath Budget</strong>

            <small>PERSONAL AIR QUALITY INTELLIGENCE</small>

          </span>

        </Link>

        <Link href="/" className="planner-back-link">

          <ArrowLeft size={16} />

          Back to dashboard

        </Link>

      </header>

      <div className="planner-container">

        <section className="planner-hero">

          <div className="planner-eyebrow">

            <Sparkles size={15} />

            YOUR DAILY AIR-QUALITY PLANNER

          </div>

          <h1>

            Plan your day.

            <br />

            <span>Breathe a little smarter.</span>

          </h1>

          <p>

            Organize outdoor activities around illustrative air-quality

            readings. Compare time slots and build a daily schedule.

          </p>

          <div className="planner-status">

            <span className="planner-status-dot" />

            Demonstration mode · Sample readings only

          </div>

        </section>

        <section className="planner-notice">

          <Activity size={21} />

          <div>

            <strong>These are not live air-quality readings</strong>

            <p>

              PM2.5 values and recommendations are illustrative. They do

              not represent current Delhi conditions or a validated

              forecast.

            </p>

          </div>

        </section>

        <section className="planner-stats">

          <article className="planner-stat">

            <span className="planner-stat-icon teal-icon">

              <CalendarDays size={20} />

            </span>

            <span className="planner-stat-label">Planned activities</span>

            <strong>{plannedActivities.length}</strong>

            <small>Items in your schedule</small>

          </article>

          <article className="planner-stat">

            <span className="planner-stat-icon orange-icon">

              <Clock3 size={20} />

            </span>

            <span className="planner-stat-label">Outdoor time</span>

            <strong>

              {Math.floor(dailyMinutes / 60)}

              <small> h </small>

              {dailyMinutes % 60}

              <small> min</small>

            </strong>

            <small>Total planned duration</small>

          </article>

          <article className="planner-stat">

            <span className="planner-stat-icon green-icon">

              <Leaf size={20} />

            </span>

            <span className="planner-stat-label">

              Planned average PM2.5

            </span>

            <strong>{averagePlannedPM25 || "—"}</strong>

            <small>Illustrative weighted average · µg/m³</small>

          </article>

        </section>

        <div className="planner-main-grid">

          <section className="planner-card">

            <div className="planner-section-heading">

              <span className="planner-heading-icon">

                <CalendarDays size={21} />

              </span>

              <div>

                <h2>Build your daily plan</h2>

                <p>Add an activity, choose a time, and set its duration.</p>

              </div>

            </div>

            <div className="planner-form">

              <label htmlFor="activity-type">What are you planning?</label>

              <select

                id="activity-type"

                value={activityType}

                onChange={(event) =>

                  updateActivityType(event.target.value as ActivityType)

                }

              >

                {activityOptions.map((option) => (

                  <option key={option.value} value={option.value}>

                    {option.label}

                  </option>

                ))}

              </select>

              <p className="planner-field-hint">

                {

                  activityOptions.find(

                    (item) => item.value === activityType

                  )?.description

                }

              </p>

              <label htmlFor="activity-time">Preferred time</label>

              <select

                id="activity-time"

                value={timeSlotId}

                onChange={(event) => setTimeSlotId(event.target.value)}

              >

                {timeSlots.map((slot) => (

                  <option key={slot.id} value={slot.id}>

                    {slot.label} · Sample PM2.5: {slot.pm25} µg/m³

                  </option>

                ))}

              </select>

              <div className="planner-selected-reading">

                <Wind size={18} />

                <div>

                  <strong>

                    {selectedSlot.pm25} µg/m³ ·{" "}

                    {getPollutionLabel(selectedSlot.pm25)}

                  </strong>

                  <span>

                    Illustrative reading for {selectedSlot.label}

                  </span>

                </div>

              </div>

              <label htmlFor="activity-duration">Duration (minutes)</label>

              <input

                id="activity-duration"

                type="number"

                min={5}

                max={480}

                step={5}

                value={duration}

                onChange={(event) =>

                  setDuration(

                    event.target.value === ""

                      ? 0

                      : Number(event.target.value)

                  )

                }

              />

              <button

                type="button"

                className="planner-primary-button"

                onClick={addActivity}

              >

                <Plus size={18} />

                Add to my plan

              </button>

              {notice && (

                <p className="planner-action-notice" role="status">

                  {notice}

                </p>

              )}

            </div>

            <div className="planner-profile-section">

              <div className="planner-section-heading compact-heading">

                <span className="planner-heading-icon green-heading-icon">

                  <ShieldCheck size={20} />

                </span>

                <div>

                  <h2>Personalize your guidance</h2>

                  <p>Choose who the plan is for.</p>

                </div>

              </div>

              <label htmlFor="planner-profile">User profile</label>

              <select

                id="planner-profile"

                value={profile}

                onChange={(event) =>

                  setProfile(event.target.value as Profile)

                }

              >

                {profiles.map((item) => (

                  <option key={item.value} value={item.value}>

                    {item.label}

                  </option>

                ))}

              </select>

              <div className="planner-guidance">

                <ShieldCheck size={19} />

                <p>{profileGuidance[profile]}</p>

              </div>

            </div>

          </section>

          <section className="planner-card suggestions-card">

            <div className="planner-section-heading">

              <span className="planner-heading-icon green-heading-icon">

                <Sparkles size={21} />

              </span>

              <div>

                <h2>Smart best-time suggestions</h2>

                <p>

                  Ranked for your selected activity, profile, and duration.

                </p>

              </div>

            </div>

            <div className="planner-recommendation-summary">

              <Info size={17} />

              <p>

                Relative rankings use sample readings, activity intensity,

                and a demonstration profile factor. This is not a validated

                health-risk model.

              </p>

            </div>

            <div className="suggestion-list">

              {bestSlots.map((slot, index) => (

                <article className="suggestion-item" key={slot.id}>

                  <div className="suggestion-rank">

                    {index === 0 ? (

                      <Leaf size={19} />

                    ) : (

                      String(index + 1).padStart(2, "0")

                    )}

                  </div>

                  <div className="suggestion-content">

                    <strong>{slot.label}</strong>

                    <span>

                      {index === 0

                        ? "Lowest relative index in this sample"

                        : getPollutionLabel(slot.pm25)}

                    </span>

                    <div className="suggestion-track">

                      <span

                        style={{

                          width: `${Math.min(

                            100,

                            (slot.pm25 / 130) * 100

                          )}%`,

                        }}

                      />

                    </div>

                    <small className="planner-recommendation-reason">

                      {slot.reason}

                    </small>

                  </div>

                  <div className="suggestion-value">

                    <strong>{slot.pm25}</strong>

                    <small>µg/m³</small>

                  </div>

                  <button

                    type="button"

                    className="suggestion-select"

                    onClick={() => chooseSuggestedTime(slot.id)}

                  >

                    Choose

                  </button>

                </article>

              ))}

            </div>

            <div className="suggestion-explanation">

              <CheckCircle2 size={19} />

              <p>

                Suggestions update when you change the activity, profile,

                or duration. Sample readings remain illustrative.

              </p>

            </div>

            <div className="planner-mini-chart">

              <h3>Sample PM2.5 throughout the day</h3>

              <div className="planner-bars">

                {timeSlots.map((slot) => {

                  const selected = slot.id === timeSlotId;

                  const recommended = bestSlots.some(

                    (item) => item.id === slot.id

                  );

                  return (

                    <button

                      type="button"

                      className={[

                        "planner-bar-column",

                        selected ? "planner-bar-selected" : "",

                        recommended ? "planner-bar-recommended" : "",

                      ]

                        .filter(Boolean)

                        .join(" ")}

                      key={slot.id}

                      onClick={() => chooseSuggestedTime(slot.id)}

                      title={`${slot.label}: ${slot.pm25} µg/m³`}

                      aria-label={`Select ${slot.label}, sample PM2.5 ${slot.pm25}`}

                      aria-pressed={selected}

                    >

                      <span className="planner-bar-value">

                        {slot.pm25}

                      </span>

                      <span

                        className="planner-bar"

                        style={{

                          height: `${Math.max(

                            24,

                            (slot.pm25 / 130) * 112

                          )}px`,

                        }}

                      />

                      <span className="planner-bar-label">

                        {slot.label.replace(":00", "")}

                      </span>

                    </button>

                  );

                })}

              </div>

            </div>

            <div className="planner-selected-recommendation">

              <span className="planner-selected-recommendation-icon">

                <TrendingDown size={19} />

              </span>

              <div>

                <strong>

                  Lowest-ranked sample slot: {bestSlots[0]?.label}

                </strong>

                <p>

                  Sample PM2.5: {bestSlots[0]?.pm25} µg/m³. Check actual

                  local air-quality information before making outdoor plans.

                </p>

                <button

                  type="button"

                  className="planner-primary-button"

                  onClick={() =>

                    bestSlots[0] && chooseSuggestedTime(bestSlots[0].id)

                  }

                >

                  Use recommended time

                </button>

              </div>

            </div>

          </section>

        </div>

        <section className="planner-card daily-plan-card">

          <div className="planner-section-heading">

            <span className="planner-heading-icon">

              <CalendarDays size={21} />

            </span>

            <div>

              <h2>Your daily schedule</h2>

              <p>Your activities stay here while the page is open.</p>

            </div>

            <span className="planner-count">

              {plannedActivities.length}{" "}

              {plannedActivities.length === 1 ? "activity" : "activities"}

            </span>

          </div>

          {plannedActivities.length === 0 ? (

            <div className="planner-empty-state">

              <span className="planner-empty-icon">

                <CalendarDays size={28} />

              </span>

              <h3>Your day starts here</h3>

              <p>

                Add your first activity to see it in your personalized daily

                schedule.

              </p>

            </div>

          ) : (

            <div className="daily-activity-list">

              {[...plannedActivities]

                .sort(

                  (a, b) =>

                    getSlot(a.timeSlotId).hour -

                    getSlot(b.timeSlotId).hour

                )

                .map((item) => {

                  const slot = getSlot(item.timeSlotId);

                  return (

                    <article

                      className="daily-activity-item"

                      key={item.id}

                    >

                      <div className="daily-activity-time">

                        <Clock3 size={16} />

                        {slot.label}

                      </div>

                      <div className="daily-activity-details">

                        <strong>{item.title}</strong>

                        <span>

                          {item.duration} minutes · Sample PM2.5{" "}

                          {slot.pm25} µg/m³

                        </span>

                      </div>

                      <button

                        type="button"

                        className="planner-remove-button"

                        onClick={() => removeActivity(item.id)}

                        aria-label={`Remove ${item.title}`}

                      >

                        <Trash2 size={17} />

                      </button>

                    </article>

                  );

                })}

            </div>

          )}

          <div className="planner-export-row">

            <div>

              <strong>Take your plan with you</strong>

              <p>

                Export your activities, time slots, sample readings, and summary as a formatted Excel workbook.

              </p>

            </div>

            <button

              type="button"

              className="planner-primary-button planner-export-button"

              onClick={exportPlan}

            >

              <Download size={18} />

              Export My Day

            </button>

          </div>

        </section>

        <section className="planner-summary">

          <div className="planner-summary-icon">

            <Leaf size={25} />

          </div>

          <div className="planner-summary-content">

            <span className="planner-eyebrow">

              <Sparkles size={14} />

              YOUR PLAN AT A GLANCE

            </span>

            <h2>

              {plannedActivities.length === 0

                ? "Make a little room for better planning."

                : "Your daily plan is ready to review."}

            </h2>

            <p>

              {plannedActivities.length === 0

                ? "Add activities and compare their sample time-slot readings to build a schedule."

                : `You have planned ${plannedActivities.length} activities totaling ${dailyMinutes} minutes. Their duration-weighted sample PM2.5 reading is ${averagePlannedPM25} µg/m³. This is an illustrative comparison, not a personal dose or a measure of actual health risk.`}

            </p>

            {plannedActivities.length > 0 && (

              <p className="planner-exposure-note">

                Illustrative concentration-duration index:{" "}

                {Math.round(estimatedExposure)} µg·h/m³. This is not a

                measured inhaled dose.

              </p>

            )}

          </div>

        </section>

        <footer className="planner-footer">

          <Link href="/" className="planner-footer-brand">

            <Wind size={17} />

            Delhi Breath Budget

          </Link>

          <p>

            Hackathon prototype · Sample data only · Not medical advice

          </p>

        </footer>

      </div>

    </main>

  );

}