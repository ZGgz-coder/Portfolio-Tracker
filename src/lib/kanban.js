export const STORAGE_KEY = "kanban-app-roadmap-v2";

export const COLUMNS = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" }
];

export const PRIORITY_OPTIONS = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" }
];

const TITLE_MAX_LENGTH = 120;

export const PHASE_GUIDE = [
  {
    id: "phase-0",
    phase: "Fase 0",
    title: "Configurar GitHub y repo limpio",
    detail: "README, estructura base y primer commit estable",
    columnId: "todo"
  },
  {
    id: "phase-1",
    phase: "Fase 1",
    title: "Definir modelo de tarea y columnas",
    detail: "Estado, CRUD y reglas minimas del Kanban",
    columnId: "todo"
  },
  {
    id: "phase-2",
    phase: "Fase 2",
    title: "Persistir datos con localStorage",
    detail: "Mantener progreso tras recargar la app",
    columnId: "in-progress"
  },
  {
    id: "phase-3",
    phase: "Fase 3",
    title: "Preparar despliegue en Vercel",
    detail: "Variables, build y URL publica para feedback",
    columnId: "todo"
  },
  {
    id: "phase-4",
    phase: "Fase 4",
    title: "Evaluar backend con Supabase",
    detail: "Auth opcional, base de datos y sincronizacion",
    columnId: "todo"
  },
  {
    id: "phase-5",
    phase: "Fase 5",
    title: "Pulir diseno con Stitch",
    detail: "Tokens visuales, componentes y responsive final",
    columnId: "todo"
  }
];

function normalizeTags(tags) {
  const tagList = Array.isArray(tags)
    ? tags.map((tag) => String(tag))
    : typeof tags === "string"
      ? tags.split(",")
      : [];

  const unique = new Set();

  for (const rawTag of tagList) {
    const clean = rawTag.trim().toLowerCase();

    if (!clean || unique.has(clean)) {
      continue;
    }

    unique.add(clean);

    if (unique.size >= 6) {
      break;
    }
  }

  return Array.from(unique);
}

function normalizeDueDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return value;
}

function normalizeTitle(value) {
  return String(value || "").trim().slice(0, TITLE_MAX_LENGTH);
}

export function validateTaskDraft({ title }) {
  const cleanTitle = normalizeTitle(title);

  if (!cleanTitle) {
    return "El titulo es obligatorio.";
  }

  return "";
}

export function parseTagsInput(tags) {
  return normalizeTags(tags);
}

function normalizeTask(task) {
  const priority = PRIORITY_OPTIONS.some((item) => item.id === task?.priority)
    ? task.priority
    : "medium";

  return {
    id: String(task.id),
    title: normalizeTitle(task.title),
    columnId: task.columnId,
    priority,
    dueDate: normalizeDueDate(task?.dueDate),
    tags: normalizeTags(task?.tags)
  };
}

function isValidTask(task) {
  return (
    typeof task?.id === "string" &&
    typeof task?.title === "string" &&
    task.title.trim().length > 0 &&
    COLUMNS.some((column) => column.id === task?.columnId)
  );
}

export function createRoadmapTasks() {
  return PHASE_GUIDE.map((item, index) => ({
    id: `seed-${item.id}`,
    title: `${item.phase}: ${item.title}`,
    columnId: item.columnId,
    priority: index < 2 ? "high" : "medium",
    dueDate: "",
    tags: ["roadmap"]
  }));
}

export function loadTasks() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return createRoadmapTasks();
  }

  try {
    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return createRoadmapTasks();
    }

    return parsed.filter(isValidTask).map(normalizeTask);
  } catch {
    return createRoadmapTasks();
  }
}

export function groupTasksByColumn(tasks) {
  return COLUMNS.map((column) => ({
    ...column,
    tasks: tasks.filter((task) => task.columnId === column.id)
  }));
}

export function createTaskFromDraft(draft) {
  return {
    id: crypto.randomUUID(),
    title: normalizeTitle(draft.title),
    columnId: draft.columnId,
    priority: PRIORITY_OPTIONS.some((item) => item.id === draft.priority)
      ? draft.priority
      : "medium",
    dueDate: normalizeDueDate(draft.dueDate),
    tags: parseTagsInput(draft.tags)
  };
}
