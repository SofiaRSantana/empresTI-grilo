const saoPauloDate = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Feriados fixos que se aplicam à capital de São Paulo.
// https://clic.prefeitura.sp.gov.br/calendario
const fixedHolidays = new Set([
  "01-01", "01-25", "04-21", "05-01", "07-09", "09-07",
  "10-12", "11-02", "11-15", "11-20", "12-25",
]);

// Sexta-feira da Paixão e Corpus Christi, feriados municipais pela Lei 14.485/2007.
// https://legislacao.prefeitura.sp.gov.br/lei-20000-de-19-de-julho-de-2007/consolidado
// As datas de 2027 seguem a recorrência da lei e devem ser revistas no calendário anual.
const movableHolidaysByYear = new Map([
  ["2026", new Set(["04-03", "06-04"])],
  ["2027", new Set(["03-26", "05-27"])],
]);

export function calculateLoanDueDate(requestedAt: Date): string {
  const day = new Date(`${saoPauloDate.format(requestedAt)}T00:00:00.000Z`);
  let countedDays = 0;

  while (countedDays < 14) {
    day.setUTCDate(day.getUTCDate() + 1);
    const civilDate = day.toISOString().slice(0, 10);
    const movableHolidays = movableHolidaysByYear.get(civilDate.slice(0, 4));
    if (!movableHolidays) {
      throw new Error(`Calendário de feriados indisponível para ${civilDate.slice(0, 4)}.`);
    }
    const weekday = day.getUTCDay();
    const monthDay = civilDate.slice(5);
    if (weekday > 0 && weekday < 6 &&
        !fixedHolidays.has(monthDay) && !movableHolidays.has(monthDay)) {
      countedDays += 1;
    }
  }

  return day.toISOString().slice(0, 10);
}

export function isOpenLoanOverdue(dueDate: string, now: Date): boolean {
  return saoPauloDate.format(now) > dueDate;
}
