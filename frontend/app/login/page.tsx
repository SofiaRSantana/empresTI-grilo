"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, getStoredUsers, saveSession, type SessionUser } from "@/lib/empres-ti-store";

const loginHints = [
  "marina@empresa.com / 123456",
  "rafael@empresa.com / senha123",
  "ops@empresa.com / admin123",
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("marina@empresa.com");
  const [password, setPassword] = useState("123456");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const activeSession = getSession();
    if (activeSession) {
      router.replace("/catalogo");
    }
  }, [router]);

  const isFormValid = useMemo(() => {
    return email.trim().length > 0 && password.trim().length > 0;
  }, [email, password]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      setError("Informe e-mail e senha para continuar.");
      return;
    }

    const storedUsers = getStoredUsers();
    const match = storedUsers.find(
      (user) => user.email.toLowerCase() === email.trim().toLowerCase() && user.password === password,
    );

    if (!match) {
      setError(`Credenciais inválidas. Tente uma das opções: ${loginHints.join(" | ")}`);
      return;
    }

    const sessionUser: SessionUser = {
      id: match.id,
      name: match.name,
      email: match.email,
      role: match.role,
      team: match.team,
    };

    setIsSubmitting(true);
    setError("");

    await new Promise((resolve) => setTimeout(resolve, 600));
    saveSession(sessionUser);
    router.push("/catalogo");
  };

  return (
    <main
      data-screen-label="01 Login"
      className="flex min-h-screen items-center justify-center bg-[#05070F] px-4 py-6 text-[#E6EAF6]"
    >
      <div className="flex h-[820px] w-full max-w-[1440px] overflow-hidden rounded-[14px] border border-[#222C4A] bg-[#080C1A] shadow-[0_0_0_1px_#222C4A,0_18px_44px_rgba(0,0,0,0.6)]">
        <section className="flex w-[560px] flex-col justify-between bg-[linear-gradient(160deg,#001449_0%,#00102F_60%,#080C1A_100%)] p-[56px]">
          <div className="flex items-center gap-[10px]">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[8px] bg-[#001449] text-[16px] font-semibold text-[#B4C6F6] shadow-[0_0_0_1px_#25408F]">
              E
            </div>
            <span className="text-[16px] font-semibold tracking-[0.02em] text-[#E6EAF6]">
              EmpresTI
            </span>
          </div>

          <div className="max-w-[360px]">
            <h1 className="text-[34px] font-semibold leading-[1.15] tracking-[-0.01em] text-[#E6EAF6]">
              Acesso ao sistema de empréstimo interno.
            </h1>

            <p className="mt-[16px] max-w-[38ch] text-[14px] leading-[1.7] text-[#93A0C6]">
              Centralize equipamentos, acompanhe prazos e mantenha a operação de tecnologia organizada.
            </p>

            <div className="mt-[26px] h-px w-full bg-[linear-gradient(to_right,rgba(230,234,246,0),#222C4A_48px,#222C4A_calc(100%-48px),rgba(230,234,246,0))]" />

            <div className="mt-[32px] flex gap-[40px]">
              <div>
                <div className="text-[24px] font-semibold text-[#E6EAF6]">3</div>
                <div className="mt-[4px] text-[12px] text-[#93A0C6]">itens por pessoa</div>
              </div>

              <div>
                <div className="text-[24px] font-semibold text-[#E6EAF6]">14</div>
                <div className="mt-[4px] text-[12px] text-[#93A0C6]">dias de prazo</div>
              </div>
            </div>
          </div>

          <div className="text-[11px] uppercase tracking-[0.08em] text-[#93A0C6]">
            Operações · v1
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center bg-[#080C1A] p-[56px]">
          <div className="w-full max-w-[372px]">
            <h2 className="text-[22px] font-semibold text-[#E6EAF6]">Entrar</h2>
            <p className="mt-[8px] text-[13px] text-[#8A93B2]">
              Acesse sua conta para consultar e solicitar equipamentos.
            </p>

            <form onSubmit={handleSubmit} className="mt-[28px] flex flex-col gap-[18px]">
              <div className="flex flex-col gap-[8px]">
                <label htmlFor="email" className="text-[12px] text-[#9AA3BC]">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-[42px] rounded-[8px] border border-[#2B3450] bg-[#0B1128] px-[12px] text-[14px] text-[#E6EAF6] outline-none placeholder:text-[#5E6884] focus:border-[#5B7FE0]"
                />
              </div>

              <div className="flex flex-col gap-[8px]">
                <label htmlFor="password" className="text-[12px] text-[#9AA3BC]">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-[42px] rounded-[8px] border border-[#2B3450] bg-[#0B1128] px-[12px] text-[14px] text-[#E6EAF6] outline-none placeholder:text-[#5E6884] focus:border-[#5B7FE0]"
                />
              </div>

              {error ? <p className="text-[12px] text-[#F0A0A5]">{error}</p> : null}

              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="mt-[6px] flex h-[44px] items-center justify-center gap-[8px] rounded-[8px] border border-[#5B7FE0] bg-transparent px-[20px] text-[14px] font-semibold text-[#B4C6F6] transition-colors hover:bg-[rgba(91,127,224,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Acessando..." : "Entrar"}
                <span className="text-[16px]">→</span>
              </button>
            </form>

            <div className="mt-[28px] h-px w-full bg-[linear-gradient(to_right,rgba(230,234,246,0),#222C4A_48px,#222C4A_calc(100%-48px),rgba(230,234,246,0))]" />

            <div className="mt-[18px] rounded-[8px] border border-[#1A2340] bg-[#0B1128] p-[10px_12px] text-[11px] text-[#93A0C6]">
              <div className="font-semibold text-[#D6E0FB]">Contas de teste:</div>
              <div className="mt-[6px] flex flex-col gap-[4px]">
                {loginHints.map((hint) => (
                  <span key={hint}>{hint}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
