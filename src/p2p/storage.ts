const PREFIX = "letsbet_p2p_v1";

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${PREFIX}_${key}`);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${PREFIX}_${key}`, JSON.stringify(value));
  } catch {
    // storage full or unavailable — ignore
  }
}

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

export function subscribe(key: string, fn: Listener): () => void {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(fn);
  return () => {
    listeners.get(key)?.delete(fn);
  };
}

export function emit(key: string): void {
  listeners.get(key)?.forEach((fn) => {
    try {
      fn();
    } catch {
      // listener errors must not break the store
    }
  });
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}
