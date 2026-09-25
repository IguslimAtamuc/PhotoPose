export function uid(prefix = 'id') {
  const rand = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 12) : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${Date.now().toString(36)}${rand.replace(/-/g, '')}`;
}
