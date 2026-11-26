// AI assistant demo conversations.
// Clearly labelled as sample conversations when running in demo mode.

export interface DemoAssistantMessage {
  role: "user" | "assistant";
  content: string;
  isDemoReply?: boolean;
}

export interface DemoAssistantThread {
  id: string;
  topic: string;
  messages: DemoAssistantMessage[];
}

export const assistantSuggestions: string[] = [
  "What's the current pollution level?",
  "When is the best time to go outside today?",
  "Compare pollution between Anand Vihar and Connaught Place",
  "Should I go for a run this evening?",
  "Which route exposes me to less PM2.5?",
];

// Pre-baked demo answers indexed by intent keyword.
// The live AI mode would call the backend advice endpoint; in DEMO mode we
// surface these so the UI feels alive without inventing new backend capabilities.
export const assistantDemoReplies: Record<string, string> = {
  "current pollution":
    "Across the 12 reporting Delhi NCR locations in this demo set, the highest PM2.5 index right now is 373 (Very Poor) at Anand Vihar, with an average PM2.5 concentration of about 151 µg/m³. Conditions are hazardous for prolonged outdoor exertion. (DEMO sample — not live data.)",
  "best time":
    "Based on the demo forecast curve, the lowest predicted PM2.5 in the next 24 hours is around 60 µg/m³ between 14:00 and 15:00 IST. If you must be outdoors, plan short, lower-exertion activity in that window and avoid early morning and late evening. (DEMO sample — not live data.)",
  "compare":
    "Demo comparison — Anand Vihar: PM2.5 214 µg/m³ (AQI 373, Very Poor). Connaught Place: PM2.5 139 µg/m³ (AQI 315, Very Poor). Both are in the Very Poor band but Anand Vihar is roughly 54% higher. (DEMO sample — not live data.)",
  "run":
    "For a run in current demo conditions (PM2.5 ~151 µg/m³ average, Very Poor), consider postponing or moving indoors. If you must run outdoors, target the 14:00–15:00 IST demo window when PM2.5 is predicted near 60 µg/m³, keep duration under 30 minutes, and wear an N95 mask before/after. (DEMO sample — not medical advice.)",
  "route":
    "Demo route recommendation — Route A (inner residential roads) is 16.1 km, ~46 min, estimated route PM2.5 39.6 µg/m³, ~1.8 cigarette-equivalents. Route B (Ring Road) is faster (38 min) but exposes you to ~3.2 cigarette-equivalents. Pick Route A if you can spare the 8 minutes. (DEMO sample — not actual measurements.)",
  default:
    "I'm running in DEMO mode using static sample data. Switch to LIVE mode in the sidebar to use the real backend advice endpoint. For this demo, I can answer about current pollution, best time to go outside, location comparisons, outdoor activity guidance, or route recommendations. (DEMO sample response.)",
};

export function pickDemoReply(userText: string): string {
  const t = userText.toLowerCase();
  if (t.includes("current") || t.includes("now") || t.includes("level")) {
    return assistantDemoReplies["current pollution"];
  }
  if (t.includes("best time") || t.includes("when") || t.includes("safe")) {
    return assistantDemoReplies["best time"];
  }
  if (t.includes("compare") || t.includes("vs") || t.includes("versus") || t.includes("between")) {
    return assistantDemoReplies["compare"];
  }
  if (t.includes("run") || t.includes("exercise") || t.includes("outdoor") || t.includes("walk") || t.includes("cycle")) {
    return assistantDemoReplies["run"];
  }
  if (t.includes("route") || t.includes("commute") || t.includes("drive")) {
    return assistantDemoReplies["route"];
  }
  return assistantDemoReplies["default"];
}

export const assistantDemoThread: DemoAssistantThread = {
  id: "demo-thread",
  topic: "Welcome",
  messages: [
    {
      role: "assistant",
      isDemoReply: true,
      content:
        "Hi — I'm the Delhi Breath Budget assistant, currently running in DEMO mode with static sample data. Ask me about current pollution, the best time to go outside, location comparisons, outdoor activity guidance, or route recommendations. Switch to LIVE in the sidebar to use the real backend.",
    },
  ],
};
