import { describe, expect, it } from "vitest";
import { calculateLoanDueDate, isOpenLoanOverdue } from "./loan-calendar";

describe("004-solicitar-emprestimo", () => {
  it("CA-08 pula feriados de São Paulo e fins de semana, inclusive na virada do ano", () => {
    expect(calculateLoanDueDate(new Date("2026-11-10T17:00:00Z"))).toBe("2026-12-01");
    expect(calculateLoanDueDate(new Date("2026-12-23T14:00:00Z"))).toBe("2027-01-14");
    expect(calculateLoanDueDate(new Date("2026-11-11T02:59:59.999Z"))).toBe("2026-12-01");
    expect(calculateLoanDueDate(new Date("2026-11-11T03:00:00Z"))).toBe("2026-12-02");
  });

  it("CA-05 mantém o empréstimo no prazo até a meia-noite em São Paulo", () => {
    expect(isOpenLoanOverdue("2026-12-01", new Date("2026-12-02T02:59:59.999Z"))).toBe(false);
    expect(isOpenLoanOverdue("2026-12-01", new Date("2026-12-02T03:00:00Z"))).toBe(true);
  });
});
