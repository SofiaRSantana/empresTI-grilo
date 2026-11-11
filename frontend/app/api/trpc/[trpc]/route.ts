import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createContext } from "@/src/server/api/context";
import { appRouter } from "@/src/server/api/router";

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    responseMeta: () => ({ headers: { "Cache-Control": "private, no-store" } }),
  });
}

export { handler as GET, handler as POST };
