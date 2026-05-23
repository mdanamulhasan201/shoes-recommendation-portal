// Lightweight global session store for family/group rentals.
// No external state library — just a tiny pub/sub the routes can subscribe to.

import { useEffect, useState } from "react";

export type Person = {
  id: string;
  first: string;
  last: string;
  email: string;
  gender?: string;
  kind: "adult" | "child";
  age?: number;
  // setup state
  scanned: boolean;
  level?: string;
  ride?: string;
  terrain?: string;
  matters?: string;
  tier?: string;
  color?: string;
  // recommendation snapshot
  bootName?: string;
  skiName?: string;
  skiLength?: number; // cm
  height?: number; // cm — for avatar proportions
  weight?: number;
  done: boolean;
};

export type GroupState = {
  groupName: string;
  language: string; // code like "en", "de"
  insurance?: "none" | "standard" | "premium";
  prepNumber?: string;
  people: Person[];
  activePersonId?: string;
};

const KEY = "ff_group_v1";

const initial: GroupState = {
  groupName: "",
  language: "en",
  people: [],
};

let state: GroupState = load();
const listeners = new Set<() => void>();

function load(): GroupState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return initial;
    return { ...initial, ...JSON.parse(raw) };
  } catch {
    return initial;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function getGroup(): GroupState {
  return state;
}

export function setGroup(patch: Partial<GroupState>) {
  state = { ...state, ...patch };
  persist();
  listeners.forEach((l) => l());
}

export function updatePerson(id: string, patch: Partial<Person>) {
  state = {
    ...state,
    people: state.people.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  };
  persist();
  listeners.forEach((l) => l());
}

export function addPerson(p: Omit<Person, "id" | "scanned" | "done">): Person {
  const person: Person = {
    ...p,
    id: `p_${Math.random().toString(36).slice(2, 8)}`,
    scanned: false,
    done: false,
  };
  state = { ...state, people: [...state.people, person], activePersonId: person.id };
  persist();
  listeners.forEach((l) => l());
  return person;
}

export function removePerson(id: string) {
  state = {
    ...state,
    people: state.people.filter((p) => p.id !== id),
    activePersonId: state.activePersonId === id ? state.people[0]?.id : state.activePersonId,
  };
  persist();
  listeners.forEach((l) => l());
}

export function resetGroup() {
  state = { ...initial };
  persist();
  listeners.forEach((l) => l());
}

export function useGroup(): GroupState {
  const [snap, setSnap] = useState(state);
  useEffect(() => {
    const l = () => setSnap({ ...state });
    listeners.add(l);
    setSnap({ ...state });
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snap;
}
