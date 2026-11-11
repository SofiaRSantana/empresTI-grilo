"use client";

import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { trpc } from "@/src/client/trpc";

const filters = [
  ["all", "Todos"], ["notebook", "Notebooks"], ["monitor", "Monitores"],
  ["camera", "Câmeras"], ["cable", "Cabos"], ["accessory", "Acessórios"],
] as const;
const categories: Record<string, string> = {
  notebook: "Notebook", monitor: "Monitor", camera: "Câmera", cable: "Cabo", accessory: "Acessório",
};
const statuses: Record<string, string> = {
  available: "Disponível", borrowed: "Emprestado", maintenance: "Manutenção",
};
const sections = [["catalog", "Catálogo"], ["loans", "Meus empréstimos"]] as const;

function formatDueDate(date: string) {
  return date.split("-").reverse().join("/");
}

export default function CatalogPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const utils = trpc.useUtils();
  const [section, setSection] = useState<(typeof sections)[number][0]>("catalog");
  const sessionQuery = trpc.auth.session.useQuery(undefined, { retry: false });
  const equipmentQuery = trpc.equipment.list.useQuery(undefined, { retry: false });
  const loansQuery = trpc.loan.listMine.useQuery(undefined, { enabled: section === "loans", retry: false });
  const request = trpc.loan.request.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.equipment.list.invalidate(), utils.loan.listMine.invalidate()]);
    },
    onError: async (error) => {
      if (error.data?.code === "CONFLICT") await utils.equipment.list.invalidate();
    },
  });
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      queryClient.clear();
      router.replace("/login");
    },
  });
  const [selectedFilter, setSelectedFilter] = useState<(typeof filters)[number][0]>("all");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [search, setSearch] = useState("");
  const authError = sessionQuery.error?.data?.code ?? equipmentQuery.error?.data?.code ??
    loansQuery.error?.data?.code ?? request.error?.data?.code;

  useEffect(() => {
    if (authError === "UNAUTHORIZED" || authError === "FORBIDDEN") router.replace("/login");
  }, [authError, router]);

  const session = sessionQuery.data;
  const items = equipmentQuery.data ?? [];
  const searchTerm = search.trim().toLowerCase();
  const filteredItems = items.filter((item) =>
    (selectedFilter === "all" || item.category === selectedFilter) &&
    (!showAvailableOnly || item.status === "available") &&
    [item.name, item.location, item.patrimonyCode].some((value) => value.toLowerCase().includes(searchTerm)),
  );
  const availableCount = items.filter((item) => item.status === "available").length;

  return (
    <main
      data-screen-label="02 Catálogo"
      className="min-h-screen bg-[#080C1A] px-4 py-5 text-[#E6EAF6]"
    >
      <div className="mx-auto flex min-h-[900px] flex-col md:flex-row w-full max-w-[1440px] overflow-hidden rounded-[14px] border border-[#222C4A] bg-[#080C1A] shadow-[0_0_0_1px_#222C4A,0_18px_44px_rgba(0,0,0,0.6)]">
        <aside className="flex w-full shrink-0 flex-col border-b md:w-[236px] md:border-r md:border-b-0 border-[#1A2340] bg-[#060A16] p-[22px_14px]">
          <div className="flex items-center gap-[10px] px-[8px]">
            <div className="flex h-[28px] w-[28px] items-center justify-center rounded-[7px] bg-[#001449] text-[14px] font-semibold text-[#B4C6F6] shadow-[0_0_0_1px_#25408F]">
              E
            </div>
            <span className="text-[14px] font-semibold tracking-[0.02em] text-[#E6EAF6]">
              EmpresTI
            </span>
          </div>

          <div className="mt-[26px] flex flex-col gap-[3px]">
            <div className="px-[8px] pb-[6px] text-[10px] font-normal uppercase tracking-[0.12em] text-[#454E68]">
              Colaborador
            </div>
            {sections.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSection(value)}
                aria-current={section === value ? "page" : undefined}
                className={`rounded-[8px] px-[10px] py-[9px] text-left text-[13px] focus-visible:outline-[#5B7FE0] ${
                  section === value
                    ? "bg-[#0E1530] text-[#E6EAF6] shadow-[inset_2px_0_0_#5B7FE0]"
                    : "text-[#9AA3BC] hover:bg-[#0B1128] hover:text-[#E6EAF6]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-auto rounded-[10px] border border-[#1A2340] bg-[#0B1128] p-[12px]">
            <div className="flex items-center gap-[10px]">
              <div className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[#132663] text-[11px] font-semibold text-[#B4C6F6]">
                {session?.name
                  .split(" ")
                  .slice(0, 2)
                  .map((word) => word[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-[#E6EAF6]">{session?.name ?? "Usuário"}</div>
                <div className="text-[12px] text-[#7C86A2]">{session?.organization ?? "Colaborador"}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="mt-[12px] w-full rounded-[8px] border border-[#2B3450] px-[10px] py-[7px] text-[11px] text-[#9AA3BC] transition-colors hover:border-[#5B7FE0] hover:text-[#E6EAF6]"
            >
              {logout.isPending ? "Saindo..." : "Sair"}
            </button>
            {logout.error && <p role="alert" className="mt-2 text-xs text-[#F0A0A5]">{logout.error.message}</p>}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {section === "catalog" && (
          <header className="flex h-[64px] items-center justify-between border-b border-[#1A2340] px-[28px]">
            <div className="flex min-w-0 flex-1 items-center gap-[12px]">
              <div className="flex h-[36px] w-[400px] items-center gap-[8px] rounded-[8px] border border-[#222C4A] bg-[#0B1128] px-[12px] text-[#5E6884]">
                <span className="text-[15px]">⌕</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Buscar equipamento"
                  placeholder="Buscar equipamento"
                  className="w-full bg-transparent text-[13px] text-[#E6EAF6] placeholder:text-[#5E6884] focus:outline-none"
                />
              </div>
            </div>

          </header>
          )}

          {section === "catalog" ? (
          <section className="flex flex-1 flex-col gap-[22px] p-4 md:p-[28px]">
            <div>
              <h1 className="text-[24px] font-semibold text-[#E6EAF6]">Catálogo</h1>
              <p className="mt-[4px] text-[13px] text-[#8A93B2]">{equipmentQuery.isSuccess ? `${items.length} equipamentos · ${availableCount} disponíveis agora` : "Equipamentos do Instituto Germinare"}</p>
            </div>

            <div className="rounded-[10px] border border-[#25408F] bg-gradient-to-r from-[#0E1530] to-[#0B1128] p-[13px_16px] text-[13px] text-[#9AA3BC]">
              <div className="flex items-center gap-[12px]">
                <span className="text-[17px] text-[#8AA6EE]">i</span>
                <div>
                  <span className="font-semibold text-[#E6EAF6]">Regra dos empréstimos:</span> até 5 empréstimos em aberto por pessoa, com devolução em 14 dias úteis. Itens em manutenção ficam indisponíveis.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-[8px]">
                {filters.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedFilter(value)}
                    aria-pressed={selectedFilter === value}
                    className={`rounded-[99px] border px-[12px] py-[6px] text-[12px] transition-colors ${
                      selectedFilter === value
                        ? "border-[#25408F] bg-[#132663] text-[#D6E0FB]"
                        : "border-[#222C4A] bg-transparent text-[#9AA3BC] hover:text-[#E6EAF6]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowAvailableOnly((value) => !value)}
                aria-pressed={showAvailableOnly}
                className={`rounded-[8px] border px-[12px] py-[7px] text-[12px] transition-colors ${
                  showAvailableOnly
                    ? "border-[#5B7FE0] bg-[rgba(91,127,224,0.12)] text-[#D6E0FB]"
                    : "border-[#2B3450] bg-transparent text-[#9AA3BC] hover:text-[#E6EAF6]"
                }`}
              >
                Só disponíveis
              </button>
            </div>

            {equipmentQuery.isPending && <p role="status">Carregando equipamentos...</p>}
            {equipmentQuery.isError && (
              <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-[#F0A0A5]">
                <p>Não foi possível carregar o catálogo.</p>
                <button type="button" onClick={() => equipmentQuery.refetch()} className="rounded-lg border border-[#5B7FE0] px-3 py-1">Tentar novamente</button>
              </div>
            )}
            {equipmentQuery.isSuccess && filteredItems.length === 0 && <p role="status">Nenhum equipamento encontrado.</p>}
            {request.error && <p role="alert" className="text-sm text-[#F0A0A5]">{request.error.message}</p>}
            {request.data && (
              <p role="status" className="text-sm text-[#5FD3AA]">
                Empréstimo confirmado. Devolva até {formatDueDate(request.data.dueDate)} no Balcão de Suporte TI.
              </p>
            )}
            <div className="grid gap-[16px] sm:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <article key={item.id} className="rounded-[12px] border border-[#1F2949] bg-[#0E1530] p-[16px] transition-colors hover:border-[#3C5DBE]">
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={800}
                      height={600}
                      unoptimized
                      className="mb-3 aspect-[4/3] w-full rounded-[9px] bg-[#0B1128] object-contain"
                    />
                  )}
                  <div className="flex items-start justify-between gap-[12px]">
                    <div className="flex h-[40px] w-[40px] items-center justify-center rounded-[9px] bg-[#0B1128] text-[20px] text-[#8AA6EE]">
                      ▣
                    </div>
                    <span
                      className={`rounded-[99px] border px-[8px] py-[3px] text-[11px] font-semibold ${
                        item.status === "available"
                          ? "border-[#3C5DBE] bg-[rgba(63,185,140,0.12)] text-[#5FD3AA]"
                          : item.status === "borrowed"
                            ? "border-[#2B3450] bg-[#1A2340] text-[#9AA3BC]"
                            : "border-[rgba(224,163,63,0.35)] bg-[rgba(224,163,63,0.12)] text-[#E8B961]"
                      }`}
                    >
                      {statuses[item.status] ?? item.status}
                    </span>
                  </div>

                  <div className="mt-[14px]">
                    <div className="text-[14.5px] font-semibold text-[#E6EAF6]">{item.name}</div>
                    <div className="mt-[6px] text-[12px] text-[#7C86A2]">{item.location}</div>
                  </div>

                  <div className="mt-[16px] space-y-[6px] text-[12px] text-[#8A93B2]">
                    <div>Categoria: {categories[item.category] ?? item.category}</div>
                    <div>Patrimônio: {item.patrimonyCode}</div>
                  </div>
                  <button
                    type="button"
                    disabled={item.status !== "available" || request.isPending}
                    onClick={() => request.mutate({ equipmentId: item.id })}
                    aria-label={item.status === "available" ? `Solicitar ${item.name}, patrimônio ${item.patrimonyCode}` : undefined}
                    className="mt-[18px] w-full rounded-[8px] border border-[#5B7FE0] px-3 py-2 text-[12px] text-[#B4C6F6] hover:bg-[rgba(91,127,224,0.12)] focus-visible:outline-[#5B7FE0] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {request.isPending && request.variables.equipmentId === item.id
                      ? "Solicitando..."
                      : item.status === "available" ? "Solicitar empréstimo" : "Indisponível"}
                  </button>
                </article>
              ))}
            </div>
            {items.some((item) => item.imageUrl) && (
              <p className="text-xs text-[#8A93B2]">Fotos de equipamentos: <a className="text-[#8AA6EE] underline" href="https://pixabay.com/">Pixabay</a>.</p>
            )}
          </section>
          ) : (
            <section className="flex flex-1 flex-col gap-[22px] p-4 md:p-[28px]">
              <div>
                <h1 className="text-[24px] font-semibold text-[#E6EAF6]">Meus empréstimos</h1>
                <p className="mt-1 text-[13px] text-[#8A93B2]">Devolva seus equipamentos no Balcão de Suporte TI até a data indicada.</p>
              </div>
              {loansQuery.isPending && <p role="status">Carregando seus empréstimos...</p>}
              {loansQuery.isError && (
                <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-[#F0A0A5]">
                  <p>Não foi possível carregar seus empréstimos.</p>
                  <button type="button" onClick={() => loansQuery.refetch()} className="rounded-lg border border-[#5B7FE0] px-3 py-1">Tentar novamente</button>
                </div>
              )}
              {loansQuery.data?.length === 0 && <p role="status">Você não tem empréstimos em aberto.</p>}
              {loansQuery.data && loansQuery.data.length > 0 && (
                <ul className="grid gap-3">
                  {loansQuery.data.map((loan) => (
                    <li key={loan.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#1F2949] bg-[#0E1530] p-4">
                      <div>
                        <p className="text-sm font-semibold">{loan.equipment.name}</p>
                        <p className="mt-1 text-xs text-[#8A93B2]">Patrimônio: {loan.equipment.patrimonyCode}</p>
                      </div>
                      <p className={`text-sm ${loan.overdue ? "text-[#F0A0A5]" : "text-[#B4C6F6]"}`}>
                        {loan.overdue ? "Em atraso desde o fim de " : "Devolver até "}
                        <time dateTime={loan.dueDate}>{formatDueDate(loan.dueDate)}</time>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
