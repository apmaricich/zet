

export interface CalendarConfig {
  width: number;
  height: number;
}

const DEFAULT_CONFIG: CalendarConfig = { width: 45, height: 16 };

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getStartDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

export function generateMonthlyCard(
  month: number,
  year: number,
  config: CalendarConfig = DEFAULT_CONFIG
): string[] {
  const lines: string[] = [];
  const width = config.width;
  const height = config.height;

  // Filing address: SYY•MM
  const yy = String(year).slice(-2);
  lines.push(`S${yy}•${month}\n`);

  // Day of week headers
  lines.push("  S   M   T   W   T   F   S");
  lines.push(" ──────────────────────────\n");

  // Date grid
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDayOfWeek(year, month);

  let day = 1;
  for (let week = 0; week < 6; week++) {
    let row = "";
    let hasDays = false;
    for (let dow = 0; dow < 7; dow++) {
      if (dow > 0) row += "  ";
      if (week === 0 && dow < startDay) {
        row += "  ";
      } else if (day > daysInMonth) {
        row += "  ";
      } else if (day < 10) {
        row += ` ${day}`;
        day++;
        hasDays = true;
      } else {
        row += `${day}`;
        day++;
        hasDays = true;
      }
    }
    if (week === 0 && startDay > 0 && !hasDays) continue;
    if (!hasDays) break;
    row = " " + row.padEnd(20) + "\n";
    lines.push(row);
  }

  // Separator
  lines.push(" ──────────────────────────");

  // Notes lines
  while (lines.length < height) {
    lines.push("");
  }

  return lines;
}

export function formatCalendar(
  month: number,
  year: number,
  config: CalendarConfig = DEFAULT_CONFIG
): string {
  const lines = generateMonthlyCard(month, year, config);
  return lines.join("\n");
}

export function generateCalendarCard(
  month: number,
  year: number,
  config: CalendarConfig = DEFAULT_CONFIG
): string {
  const lines = generateMonthlyCard(month, year, config);
  return lines.join("\n");
}
