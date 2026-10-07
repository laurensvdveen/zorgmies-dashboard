import { kv } from "@vercel/kv";

// ============================================================
// Vercel KV storage helpers for ZorgMies Dashboard
// Collections: todos, callbacks, intakes
// ============================================================

export type LocationId = "regiobar" | "capelle" | "nissewaard";

// --- To-do ---

export type Priority = "hoog" | "normaal" | "laag";

export interface Todo {
  id: string;
  title: string;
  description: string;
  location: LocationId;
  priority: Priority;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

const TODO_KEY = "zorgmies:todos";

export async function getTodos(): Promise<Todo[]> {
  const todos = await kv.get<Todo[]>(TODO_KEY);
  return todos ?? [];
}

export async function addTodo(
  data: Pick<Todo, "title" | "description" | "location" | "priority">
): Promise<Todo> {
  const todos = await getTodos();
  const todo: Todo = {
    id: crypto.randomUUID(),
    title: data.title,
    description: data.description,
    location: data.location,
    priority: data.priority ?? "normaal",
    done: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  todos.unshift(todo);
  await kv.set(TODO_KEY, todos);
  return todo;
}

export async function updateTodo(
  id: string,
  updates: Partial<Pick<Todo, "title" | "description" | "location" | "done" | "priority">>
): Promise<Todo | null> {
  const todos = await getTodos();
  const idx = todos.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  todos[idx] = { ...todos[idx], ...updates, updatedAt: new Date().toISOString() };
  await kv.set(TODO_KEY, todos);
  return todos[idx];
}

export async function deleteTodo(id: string): Promise<boolean> {
  const todos = await getTodos();
  const filtered = todos.filter((t) => t.id !== id);
  if (filtered.length === todos.length) return false;
  await kv.set(TODO_KEY, filtered);
  return true;
}

// --- Callbacks (terugbelafspraken) ---

export interface Callback {
  id: string;
  name: string;
  phone: string;
  dateTime: string;
  note: string;
  location: LocationId;
  done: boolean;
  createdAt: string;
}

const CALLBACK_KEY = "zorgmies:callbacks";

export async function getCallbacks(): Promise<Callback[]> {
  const callbacks = await kv.get<Callback[]>(CALLBACK_KEY);
  return callbacks ?? [];
}

export async function addCallback(
  data: Pick<Callback, "name" | "phone" | "dateTime" | "note" | "location">
): Promise<Callback> {
  const callbacks = await getCallbacks();
  const cb: Callback = {
    id: crypto.randomUUID(),
    ...data,
    done: false,
    createdAt: new Date().toISOString(),
  };
  callbacks.push(cb);
  // Sort by dateTime
  callbacks.sort(
    (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
  );
  await kv.set(CALLBACK_KEY, callbacks);
  return cb;
}

export async function updateCallback(
  id: string,
  updates: Partial<Pick<Callback, "done">>
): Promise<Callback | null> {
  const callbacks = await getCallbacks();
  const idx = callbacks.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  callbacks[idx] = { ...callbacks[idx], ...updates };
  await kv.set(CALLBACK_KEY, callbacks);
  return callbacks[idx];
}

export async function deleteCallback(id: string): Promise<boolean> {
  const callbacks = await getCallbacks();
  const filtered = callbacks.filter((c) => c.id !== id);
  if (filtered.length === callbacks.length) return false;
  await kv.set(CALLBACK_KEY, filtered);
  return true;
}

// --- Intakes (nieuwe aanvragen) ---

export interface Intake {
  id: string;
  clientName: string;
  phone: string;
  address: string;
  careType: string;
  urgency: "hoog" | "normaal" | "laag";
  location: LocationId;
  notes: string;
  status: "open" | "in_behandeling" | "afgerond";
  createdAt: string;
  updatedAt: string;
}

const INTAKE_KEY = "zorgmies:intakes";

export async function getIntakes(): Promise<Intake[]> {
  const intakes = await kv.get<Intake[]>(INTAKE_KEY);
  return intakes ?? [];
}

export async function addIntake(
  data: Pick<
    Intake,
    "clientName" | "phone" | "address" | "careType" | "urgency" | "location" | "notes"
  >
): Promise<Intake> {
  const intakes = await getIntakes();
  const intake: Intake = {
    id: crypto.randomUUID(),
    ...data,
    status: "open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  intakes.unshift(intake);
  await kv.set(INTAKE_KEY, intakes);
  return intake;
}

export async function updateIntake(
  id: string,
  updates: Partial<Pick<Intake, "status" | "notes">>
): Promise<Intake | null> {
  const intakes = await getIntakes();
  const idx = intakes.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  intakes[idx] = { ...intakes[idx], ...updates, updatedAt: new Date().toISOString() };
  await kv.set(INTAKE_KEY, intakes);
  return intakes[idx];
}

export async function deleteIntake(id: string): Promise<boolean> {
  const intakes = await getIntakes();
  const filtered = intakes.filter((i) => i.id !== id);
  if (filtered.length === intakes.length) return false;
  await kv.set(INTAKE_KEY, filtered);
  return true;
}
