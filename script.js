const API_BASE = "https://ai-ds-salary-prediction-1.onrender.com/";

const form = document.getElementById("predictForm");
const submitBtn = document.getElementById("submitBtn");
const errorMsg = document.getElementById("errorMsg");
const resultValue = document.getElementById("resultValue");
const resultHint = document.getElementById("resultHint");
const apiDot = document.getElementById("apiDot");
const apiStatusText = document.getElementById("apiStatusText");
document.getElementById("endpointHost").textContent = API_BASE;

// --- slider live readouts ---
const sliderIds = [
  "years_experience",
  "weekly_hours",
  "bonus_pct",
  "certifications_count",
  "interviews_to_offer",
  "fears_ai_automation_score",
];

sliderIds.forEach((id) => {
  const input = document.getElementById(id);
  const out = document.getElementById(id + "_out");
  if (!input || !out) return;
  out.textContent = input.value;
  input.addEventListener("input", () => {
    out.textContent = input.value;
  });
});

// --- backend health check ---
async function checkBackend() {
  try {
    const res = await fetch(`${API_BASE}/`, { method: "GET" });
    if (!res.ok) throw new Error("bad status");
    apiDot.classList.remove("bad");
    apiDot.classList.add("ok");
    apiStatusText.textContent = "backend connected";
  } catch (err) {
    apiDot.classList.remove("ok");
    apiDot.classList.add("bad");
    apiStatusText.textContent = "backend unreachable";
  }
}
checkBackend();

// --- field constraints, mirrors the FastAPI Pydantic model ---
const NUMERIC_RULES = {
  years_experience: { min: 0, max: 24, type: "int" },
  certifications_count: { min: 0, max: 9, type: "int" },
  weekly_hours: { min: 24, max: 67, type: "int" },
  equity_offered_pct: { min: 0, max: 1.3, type: "float" },
  bonus_pct: { min: 0, max: 30, type: "int" },
  job_satisfaction_score: { min: 1.1, max: 24, type: "float" },
  interviews_to_offer: { min: 1, max: 16, type: "int" },
  fears_ai_automation_score: { min: 1, max: 10, type: "int" },
};

function readForm() {
  const data = new FormData(form);
  const payload = {};
  const problems = [];

  for (const [key, rule] of Object.entries(NUMERIC_RULES)) {
    const raw = data.get(key);
    const num = rule.type === "int" ? parseInt(raw, 10) : parseFloat(raw);
    if (Number.isNaN(num)) {
      problems.push(`${key} must be a number`);
      continue;
    }
    if (num < rule.min || num > rule.max) {
      problems.push(`${key} must be between ${rule.min} and ${rule.max}`);
      continue;
    }
    payload[key] = num;
  }

  const stringFields = [
    "job_title",
    "experience_level",
    "employment_type",
    "company_size",
    "company_location",
    "employee_residence",
    "industry",
    "education_level",
    "primary_language",
    "salary_currency",
  ];
  stringFields.forEach((key) => {
    payload[key] = data.get(key);
  });

  const boolFields = [
    "has_ml_in_title",
    "manages_people",
    "uses_ai_tools_daily",
    "switched_jobs_last_year",
  ];
  boolFields.forEach((key) => {
    payload[key] = document.getElementById(key).checked;
  });

  return { payload, problems };
}

function formatUsd(value) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  } catch (err) {
    return `$${Math.round(value).toLocaleString()}`;
  }
}

function setResultState(state, text) {
  resultValue.classList.remove("pending", "error");
  if (state) resultValue.classList.add(state);
  resultValue.textContent = text;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorMsg.textContent = "";

  const { payload, problems } = readForm();
  if (problems.length > 0) {
    errorMsg.textContent = problems[0];
    return;
  }

  submitBtn.disabled = true;
  submitBtn.querySelector("span").textContent = "running…";
  setResultState("pending", "…");
  resultHint.textContent = "waiting on the model";

  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`request failed (${res.status}): ${detail}`);
    }

    const json = await res.json();
    const salary = json.salary_usd;

    setResultState(null, formatUsd(salary));
    resultHint.textContent = "modeled annual salary in USD";
    apiDot.classList.remove("bad");
    apiDot.classList.add("ok");
    apiStatusText.textContent = "backend connected";
  } catch (err) {
    setResultState("error", "request failed");
    resultHint.textContent = "check the backend is running on port 8000";
    errorMsg.textContent = err.message || "couldn't reach the backend";
    apiDot.classList.remove("ok");
    apiDot.classList.add("bad");
    apiStatusText.textContent = "backend unreachable";
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector("span").textContent = "run estimate";
  }
});
