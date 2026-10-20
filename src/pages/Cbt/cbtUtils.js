export const QUESTION_TYPES = [
  { id: "mcq", label: "Multiple choice" },
  { id: "truefalse", label: "True or false" },
  { id: "short", label: "Short answer" },
];

export const typeLabel = (type) => QUESTION_TYPES.find((item) => item.id === type)?.label || type;

const uid = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const blankQuestion = (type) => ({
  question_id: uid("q"),
  type,
  prompt: "",
  options:
    type === "mcq"
      ? [{ id: uid("o"), text: "" }, { id: uid("o"), text: "" }]
      : type === "truefalse"
        ? [{ id: "true", text: "True" }, { id: "false", text: "False" }]
        : [],
  correct_option_id: "",
  marks: 1,
  explanation: "",
  expected_answer: "",
  marking_guide: "",
  grading_notes: "",
});

/** Duplicate with the correct option carried over to the copied option ids. */
export const copyQuestion = (question) => {
  const options = question.type === "mcq" ? question.options.map((item) => ({ ...item, id: uid("o") })) : question.options.map((item) => ({ ...item }));
  const index = question.options.findIndex((item) => item.id === question.correct_option_id);
  return {
    ...question,
    question_id: uid("q"),
    options,
    correct_option_id: question.type === "mcq" ? (index >= 0 ? options[index].id : "") : question.correct_option_id,
  };
};

export const toLocalInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const fromLocalInput = (value) => (value ? new Date(value).toISOString() : null);

export const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString([], { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
};

export const fmt = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  return Number.isFinite(number) ? String(Math.round(number * 100) / 100) : "—";
};

const twoDecimals = (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

export const totalMarks = (questions) => Math.round(questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0) * 100) / 100;

/** Marks problems that must be fixed even to save a draft. */
export const marksProblem = (question) => {
  const marks = Number(question.marks);
  if (question.marks === "" || !Number.isFinite(marks)) return "Enter the marks for this question.";
  if (marks < 0) return "Marks cannot be negative.";
  if (marks > 1000) return "Marks cannot exceed 1000.";
  if (!twoDecimals(marks)) return "Use at most two decimal places.";
  return "";
};

/** Per-question messages that block publishing. Mirrors the server rules. */
export const questionProblems = (question) => {
  const problems = [];
  if (!String(question.prompt || "").trim()) problems.push("Add the question text.");
  const marks = marksProblem(question);
  if (marks) problems.push(marks);
  else if (!(Number(question.marks) > 0)) problems.push("Marks must be greater than zero.");
  if (question.type === "mcq") {
    const filled = question.options.filter((item) => String(item.text || "").trim());
    if (filled.length < 2) problems.push("Add at least two options.");
    if (question.options.some((item) => !String(item.text || "").trim())) problems.push("Fill in or remove empty options.");
    const texts = filled.map((item) => String(item.text).trim().toLowerCase());
    if (new Set(texts).size !== texts.length) problems.push("Options must be different from each other.");
  }
  if (question.type !== "short" && !question.correct_option_id) problems.push("Choose the correct answer.");
  return problems;
};

export const formProblems = (form, assessmentMax) => {
  const problems = [];
  if (!String(form.title || "").trim()) problems.push("Add a title.");
  if (!String(form.instructions || "").trim()) problems.push("Add instructions for students.");
  if (!form.class_id) problems.push("Choose a class.");
  const duration = Number(form.duration_minutes);
  if (!Number.isInteger(duration) || duration < 1 || duration > 600) problems.push("Set a duration between 1 and 600 minutes.");
  if (!form.grading_field) problems.push("Choose which report assessment this test feeds.");
  else if (!(Number(assessmentMax) > 0)) problems.push("The chosen assessment has no maximum score.");
  if (form.questions.length === 0) problems.push("Add at least one question.");
  form.questions.forEach((question, index) => {
    questionProblems(question).forEach((message) => problems.push(`Question ${index + 1}: ${message}`));
  });
  const total = totalMarks(form.questions);
  if (form.questions.length && Number(assessmentMax) > 0 && Math.round(total * 100) !== Math.round(Number(assessmentMax) * 100)) {
    problems.push(`Question marks add up to ${total} but must equal ${assessmentMax}.`);
  }
  return problems;
};

/** For each question, the message to show when its marks push the running total past the maximum. */
export const overMaxMessages = (questions, assessmentMax) => {
  const max = Number(assessmentMax);
  const messages = {};
  if (!(max > 0)) return messages;
  let running = 0;
  questions.forEach((question) => {
    running = Math.round((running + (Number(question.marks) || 0)) * 100) / 100;
    if (running > max) messages[question.question_id] = `Total would pass the maximum of ${max}.`;
  });
  return messages;
};

export const STATUS_LABEL = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
  not_started: "Not started",
  in_progress: "In progress",
  awaiting_marking: "Awaiting marking",
  graded: "Graded",
  released: "Released",
  absent: "Absent",
  not_assigned: "Not assigned",
};

/** 1:05:09 or 05:09 from a number of milliseconds. */
export const formatClock = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

export const FILTERS = [
  { id: "all", label: "All" },
  { id: "not_started", label: "Not started" },
  { id: "in_progress", label: "In progress" },
  { id: "submitted", label: "Submitted" },
  { id: "awaiting_marking", label: "Awaiting marking" },
  { id: "graded", label: "Graded" },
  { id: "released", label: "Released" },
];
