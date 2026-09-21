const BASE_MONDAY = new Date(2026, 8, 21, 12);

export function startOfWeek(date = new Date()) {
  const current = new Date(date);
  current.setHours(12, 0, 0, 0);
  const day = current.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  current.setDate(current.getDate() - daysSinceMonday);
  return current;
}

export function getWeekInfo(date = new Date()) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const diff = Math.floor((start - BASE_MONDAY) / 604800000);
  const formType = ((diff % 2) + 2) % 2 === 0 ? 'A' : 'B';
  return { start, end, formType, key: toDateKey(start) };
}

export function toDateKey(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export function formatDate(date, options = { day: '2-digit', month: '2-digit' }) {
  return new Intl.DateTimeFormat('pt-BR', options).format(date);
}

export function formatWeek(info) {
  return `${formatDate(info.start)} a ${formatDate(info.end)}`;
}
