import { cookies } from "next/headers";
import { db } from "@/src/server/db";
import { createServerAuth, getCatalogMembership, verifyUser } from "@/src/server/services/auth";

export async function createContext() {
  const cookieStore = await cookies();
  const auth = createServerAuth({
    getAll: () => cookieStore.getAll(),
    setAll: (changes) => {
      for (const { name, value, options } of changes) cookieStore.set(name, value, options);
    },
  });
  let user: ReturnType<typeof verifyUser> | undefined;
  let membership: ReturnType<typeof getCatalogMembership> | undefined;
  return {
    auth,
    db,
    getUser: () => user ??= verifyUser(auth),
    getMembership: (identity: Parameters<typeof getCatalogMembership>[1]) =>
      membership ??= getCatalogMembership(db, identity),
  };
}
