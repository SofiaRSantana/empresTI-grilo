import { Prisma, type PrismaClient } from "@prisma/client";
import {
  calculateLoanDueDate,
  isOpenLoanOverdue,
  toLoanDueDate,
} from "@/src/server/services/loan-calendar";

type Borrower = { tenantId: string; userId: string };
const maximumOpenLoans = 5;
const maximumAttempts = 3;

export async function requestLoan(
  db: PrismaClient,
  { tenantId, userId }: Borrower,
  equipmentId: string,
  clock: () => Date = () => new Date(),
) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await db.$transaction(async (tx) => {
        const equipment = await tx.equipment.findFirst({
          where: { tenantId, id: equipmentId },
          select: { status: true },
        });
        if (!equipment) return { status: "missing" } as const;
        if (equipment.status !== "available") return { status: "unavailable" } as const;

        const openLoans = await tx.loan.findMany({
          where: { tenantId, borrowerId: userId, returnedAt: null },
          select: { dueAt: true },
        });
        if (openLoans.length >= maximumOpenLoans) return { status: "limit" } as const;
        const requestedAt = clock();
        if (openLoans.some(({ dueAt }) => isOpenLoanOverdue(toLoanDueDate(dueAt), requestedAt))) {
          return { status: "overdue" } as const;
        }
        const dueDate = calculateLoanDueDate(requestedAt);
        // due_at representa a data civil em São Paulo. Meio-dia UTC cai nessa mesma data.
        const dueAt = new Date(`${dueDate}T12:00:00.000Z`);
        const loan = await tx.loan.create({
          data: { tenantId, equipmentId, borrowerId: userId, requestedBy: userId, requestedAt, dueAt },
          select: { id: true },
        });
        // O trigger existente atualiza a situação do equipamento na mesma transação.
        return { status: "ok", id: loan.id, dueDate } as const;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      if (error.code === "P2002") return { status: "unavailable" } as const;
      if (error.code !== "P2034") throw error;
      if (attempt === maximumAttempts) return { status: "conflict" } as const;
    }
  }
}

export async function listOpenLoans(
  db: PrismaClient,
  { tenantId, userId }: Borrower,
  now: Date = new Date(),
) {
  const loans = await db.loan.findMany({
    where: { tenantId, borrowerId: userId, returnedAt: null },
    orderBy: [{ dueAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      dueAt: true,
      equipment: { select: { name: true, patrimonyCode: true } },
    },
  });
  return loans.map(({ dueAt, ...loan }) => {
    const dueDate = toLoanDueDate(dueAt);
    return { ...loan, dueDate, overdue: isOpenLoanOverdue(dueDate, now) };
  });
}
