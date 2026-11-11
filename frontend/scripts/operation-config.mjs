import { createClient } from "@supabase/supabase-js";

export function createOperationsClient(projectFlag) {
  const { DATABASE_URL, SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
  if (!DATABASE_URL || !SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error("Configure DATABASE_URL, SUPABASE_URL e SUPABASE_SECRET_KEY no ambiente.");
  }

  const supabaseUrl = new URL(SUPABASE_URL);
  const databaseUrl = new URL(DATABASE_URL);
  const loopback = new Set(["127.0.0.1", "localhost", "[::1]"]);
  const local = loopback.has(supabaseUrl.hostname) && loopback.has(databaseUrl.hostname);

  if (projectFlag || !local) {
    const project = /^--project=([a-z0-9]{20})$/.exec(projectFlag ?? "")?.[1];
    const host = `${project}.supabase.co`;
    const direct = databaseUrl.hostname === `db.${host}`;
    const pooler = databaseUrl.hostname.endsWith(".pooler.supabase.com") &&
      databaseUrl.username === `postgres.${project}`;
    if (!project || supabaseUrl.origin !== `https://${host}` || (!direct && !pooler)) {
      throw new Error("Use serviços locais ou confirme o mesmo projeto remoto do banco e do Supabase.");
    }
  }

  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
