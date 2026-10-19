export type UserRole = "design" | "operations" | "admin";

export type EquipmentStatus = "Disponível" | "Emprestado" | "Manutenção";

export type EmprestimoCategory =
  | "Notebooks"
  | "Monitores"
  | "Câmeras"
  | "Acessórios";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  team: string;
};

export type Equipment = {
  id: string;
  name: string;
  category: EmprestimoCategory;
  status: EquipmentStatus;
  ownerId?: string;
  ownerName?: string;
  dueDate?: string;
  notes?: string;
  location: string;
};

export type SessionUser = Pick<User, "id" | "name" | "email" | "role" | "team">;

export const STORAGE_USERS = "empresTI_users";
export const STORAGE_EQUIPMENT = "empresTI_equipment";
export const STORAGE_SESSION = "empresTI_session";

export const seedUsers: User[] = [
  {
    id: "user-marina",
    name: "Marina Alves",
    email: "marina@empresa.com",
    password: "123456",
    role: "design",
    team: "Design",
  },
  {
    id: "user-rafael",
    name: "Rafael Lima",
    email: "rafael@empresa.com",
    password: "senha123",
    role: "operations",
    team: "Operações",
  },
  {
    id: "user-ops",
    name: "Equipe Ops",
    email: "ops@empresa.com",
    password: "admin123",
    role: "admin",
    team: "Suporte",
  },
];

export const seedEquipment: Equipment[] = [
  {
    id: "eq-mbp-14",
    name: "MacBook Pro 14\"",
    category: "Notebooks",
    status: "Disponível",
    location: "Patrimônio 1042",
  },
  {
    id: "eq-t14",
    name: "ThinkPad T14",
    category: "Notebooks",
    status: "Emprestado",
    ownerId: "user-rafael",
    ownerName: "Rafael Lima",
    dueDate: "2026-09-26",
    location: "Patrimônio 1188",
  },
  {
    id: "eq-dell-27",
    name: "Dell UltraSharp 27\"",
    category: "Monitores",
    status: "Manutenção",
    notes: "Tela com falha de brilho em revisão",
    location: "Patrimônio 0871",
  },
  {
    id: "eq-lg-24",
    name: "LG UltraFine 24\"",
    category: "Monitores",
    status: "Disponível",
    location: "Patrimônio 0910",
  },
  {
    id: "eq-sony-a7",
    name: "Sony A7 III",
    category: "Câmeras",
    status: "Disponível",
    location: "Patrimônio 0233",
  },
  {
    id: "eq-dock-anker",
    name: "Dock USB-C Anker",
    category: "Acessórios",
    status: "Emprestado",
    ownerId: "user-marina",
    ownerName: "Marina Alves",
    dueDate: "2026-09-29",
    location: "Patrimônio 0455",
  },
];

const readStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const getStoredUsers = (): User[] => {
  const users = readStorage<User[]>(STORAGE_USERS, seedUsers);
  if (!users.length) {
    writeStorage(STORAGE_USERS, seedUsers);
    return seedUsers;
  }
  return users;
};

export const saveUsers = (users: User[]) => {
  writeStorage(STORAGE_USERS, users);
};

export const getStoredEquipment = (): Equipment[] => {
  const items = readStorage<Equipment[]>(STORAGE_EQUIPMENT, seedEquipment);
  if (!items.length) {
    writeStorage(STORAGE_EQUIPMENT, seedEquipment);
    return seedEquipment;
  }
  return items;
};

export const saveEquipment = (items: Equipment[]) => {
  writeStorage(STORAGE_EQUIPMENT, items);
};

export const getSession = (): SessionUser | null => {
  return readStorage<SessionUser | null>(STORAGE_SESSION, null);
};

export const saveSession = (user: SessionUser | null) => {
  writeStorage(STORAGE_SESSION, user);
};

export const clearSession = () => {
  saveSession(null);
};

export const formatDueDate = (value?: string) => {
  if (!value) return "Sem prazo";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem prazo";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);
};

export const addDays = (base: Date, days: number) => {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
};
