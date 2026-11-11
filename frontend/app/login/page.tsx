"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { trpc } from "@/src/client/trpc";
import { loginInput, type LoginInput } from "@/src/shared/login-input";

export default function LoginPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginInput),
    defaultValues: { email: "", password: "" },
  });
  const login = trpc.auth.login.useMutation({
    onSuccess: () => router.replace("/catalogo"),
  });

  return (
    <main
      data-screen-label="01 Login"
      className="flex min-h-dvh items-center justify-center bg-[#05070F] px-4 py-4 text-[#E6EAF6]"
    >
      <div className="flex min-h-[min(560px,calc(100dvh_-_2rem))] w-full max-w-[1440px] overflow-hidden rounded-[14px] border border-[#222C4A] bg-[#080C1A] shadow-[0_0_0_1px_#222C4A,0_18px_44px_rgba(0,0,0,0.6)] lg:min-h-[min(820px,calc(100dvh_-_2rem))]">
        <section className="hidden w-[560px] shrink-0 justify-between gap-6 bg-[linear-gradient(160deg,#001449_0%,#00102F_60%,#080C1A_100%)] px-[56px] py-[clamp(1rem,6dvh,3.5rem)] lg:flex lg:flex-col">
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
                <div className="text-[24px] font-semibold text-[#E6EAF6]">5</div>
                <div className="mt-[4px] text-[12px] text-[#93A0C6]">itens por pessoa</div>
              </div>

              <div>
                <div className="text-[24px] font-semibold text-[#E6EAF6]">14</div>
                <div className="mt-[4px] text-[12px] text-[#93A0C6]">dias úteis de prazo</div>
              </div>
            </div>
          </div>

          <div className="text-[11px] uppercase tracking-[0.08em] text-[#93A0C6]">
            Operações · v1
          </div>
        </section>

        <section className="flex min-w-0 flex-1 items-center justify-center bg-[#080C1A] px-6 py-[clamp(0.75rem,3dvh,3.5rem)] sm:px-[56px]">
          <div className="w-full max-w-[372px]">
            <h2 className="text-[22px] font-semibold text-[#E6EAF6]">Entrar</h2>
            <p className="mt-[8px] text-[13px] text-[#8A93B2]">
              Acesse sua conta para consultar e solicitar equipamentos.
            </p>

            <form noValidate onSubmit={handleSubmit((input) => login.mutate(input))} className="mt-[28px] flex flex-col gap-[18px]">
              <div className="flex flex-col gap-[8px]">
                <label htmlFor="email" className="text-[12px] text-[#9AA3BC]">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  {...register("email")}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  autoComplete="email"
                  className="h-[42px] rounded-[8px] border border-[#2B3450] bg-[#0B1128] px-[12px] text-[14px] text-[#E6EAF6] outline-none placeholder:text-[#5E6884] focus:border-[#5B7FE0]"
                />
                {errors.email && <p id="email-error" role="alert" className="text-xs text-[#F0A0A5]">{errors.email.message}</p>}
              </div>

              <div className="flex flex-col gap-[8px]">
                <label htmlFor="password" className="text-[12px] text-[#9AA3BC]">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  {...register("password")}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  autoComplete="current-password"
                  className="h-[42px] rounded-[8px] border border-[#2B3450] bg-[#0B1128] px-[12px] text-[14px] text-[#E6EAF6] outline-none placeholder:text-[#5E6884] focus:border-[#5B7FE0]"
                />
                {errors.password && <p id="password-error" role="alert" className="text-xs text-[#F0A0A5]">{errors.password.message}</p>}
              </div>

              {login.error && <p role="alert" className="text-xs text-[#F0A0A5]">{login.error.message}</p>}

              <button
                type="submit"
                disabled={login.isPending}
                className="mt-[6px] flex h-[44px] items-center justify-center gap-[8px] rounded-[8px] border border-[#5B7FE0] bg-transparent px-[20px] text-[14px] font-semibold text-[#B4C6F6] transition-colors hover:bg-[rgba(91,127,224,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {login.isPending ? "Acessando..." : "Entrar"}
                <span className="text-[16px]">→</span>
              </button>
            </form>

            <div className="mt-[28px] h-px w-full bg-[linear-gradient(to_right,rgba(230,234,246,0),#222C4A_48px,#222C4A_calc(100%-48px),rgba(230,234,246,0))]" />

            <p className="mt-[18px] text-center text-xs text-[#93A0C6]">Precisa de ajuda para acessar? Procure o Balcão de Suporte TI.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
