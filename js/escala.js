const TEAMS = ['A', 'B', 'C', 'D', 'E'];

const MONTHS = [
  {
    month: 10,
    shifts: [
      'C D D B A A E E C D D B B A E E C C D B B A A E C C D D B A A',
      'E C C D B B A A E C C D D B A A E E C D D B B A E E C C D B B',
      'A E E C D D B B A E E C C D B B A A E C C D D B A A E E C D D'
    ],
    off: [
      'D A A E E E D D D A A E E C D D D D A E E E E D D D A A E E E',
      'B B B A C C C C B B B A A E C C B B B A A C C C B B B B A C C'
    ]
  },
  {
    month: 11,
    shifts: [
      'E E C D D B B A E E C C D B B A A E C C D D B A A E E C D D',
      'A A E C C D D B A A E E C D D B B A E E C C D B B A A E C C',
      'B B A E E C C D B B A A E C C D D B A A E E C D D B B A E E'
    ],
    off: [
      'D D B B B E E E D D B B B E E E E D B B B B E E E D D B B B',
      'C C D A A A A C C C D D A A A C C C D D A A A C C C C D A A'
    ]
  },
  {
    month: 12,
    shifts: [
      'B B A E E C C D B B A A E C C D D B A A E E C D D B B A E E C',
      'D D B A A E E C D D B B A E E C C D B B A A E C C D D B A A E',
      'C C D B B A A E C C D D B A A E E C D D B B A E E C C D B B A'
    ],
    off: [
      'E E C D D D D A E E C C D D D A A E C C D D D A A E E C D D D',
      'A A E C C B B B A A E E C B B B B A E E C C B B B A A E C C B'
    ]
  }
];

export const schedule2026 = {};

for (const month of MONTHS) {
  const daysInMonth = new Date(2026, month.month, 0).getDate();
  const shiftRows = month.shifts.map(row => row.trim().split(/\s+/));
  const offRows = month.off.map(row => row.trim().split(/\s+/));
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `2026-${String(month.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    schedule2026[key] = {
      shifts: shiftRows.map(row => row[day - 1]),
      off: offRows.map(row => row[day - 1])
    };
  }
}

export function validateSchedule() {
  const errors = [];
  const expectedDates = [];
  for (const month of MONTHS) {
    const daysInMonth = new Date(2026, month.month, 0).getDate();
    const rowLengths = [...month.shifts, ...month.off].map(row => row.trim().split(/\s+/).length);
    if (rowLengths.some(length => length !== daysInMonth)) {
      errors.push(`2026-${String(month.month).padStart(2, '0')}: cada linha deve conter ${daysInMonth} valores; encontrados ${rowLengths.join(', ')}`);
    }
  }
  const date = new Date(2026, 9, 1, 12);
  while (date.getFullYear() === 2026 && date.getMonth() < 12) {
    expectedDates.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
    date.setDate(date.getDate() + 1);
  }

  for (const key of expectedDates) {
    const entry = schedule2026[key];
    if (!entry) {
      errors.push(`${key}: escala ausente`);
      continue;
    }

    const shifts = entry.shifts;
    const off = entry.off;
    const shiftTeams = new Set(shifts);
    const allTeams = [...shifts, ...off];
    const valid = shifts.length === 3 && off.length === 2
      && allTeams.every(team => TEAMS.includes(team))
      && shiftTeams.size === 3
      && new Set(off).size === 2
      && allTeams.length === 5
      && new Set(allTeams).size === 5;

    if (!valid) errors.push(`${key}: turnos ou folgas ausentes, duplicados ou inválidos`);
  }

  for (const key of Object.keys(schedule2026)) {
    if (!expectedDates.includes(key)) errors.push(`${key}: data fora do período cadastrado`);
  }
  return errors;
}

export const scheduleValidationErrors = validateSchedule();
if (scheduleValidationErrors.length) {
  console.error('Falhas na validação da escala 2026:', scheduleValidationErrors);
}