"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { translate as t, type Lang } from "@/i18n/dictionaries";

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

type Grecaptcha = {
  render: (
    container: HTMLElement,
    params: {
      sitekey: string;
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
    }
  ) => number;
  reset: (widgetId: number) => void;
};

export default function AdminLoginForm({ lang }: { lang: Lang }) {
  const router = useRouter();
  const tr = (key: string) => t(lang, key);

  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaEnabled, setCaptchaEnabled] = useState(false);
  const captchaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return;
    setCaptchaEnabled(true);

    const w = window as unknown as {
      grecaptcha?: Grecaptcha;
      __apxCaptchaOnload?: () => void;
    };

    const render = () => {
      if (captchaRef.current && w.grecaptcha) {
        w.grecaptcha.render(captchaRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (token: string) => setCaptchaToken(token),
          "expired-callback": () => setCaptchaToken(""),
        });
      }
    };

    if (w.grecaptcha) {
      render();
    } else {
      w.__apxCaptchaOnload = render;
      const script = document.createElement("script");
      script.src =
        "https://www.google.com/recaptcha/api.js?onload=__apxCaptchaOnload&render=explicit";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (captchaEnabled && !captchaToken) {
      setError(tr("admin.login.captcha"));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, captchaToken }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? tr("admin.login.fail"));
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("admin.login.fail"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-24 sm:px-6">
      <div className="card-lift rounded-xl border border-zinc-800 bg-zinc-900/50 p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
          <LockIcon />
        </div>
        <h1 className="mt-4 text-2xl font-black">{tr("admin.login.title")}</h1>
        <p className="mt-2 text-sm text-zinc-400">{tr("admin.login.subtitle")}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">
              {tr("admin.login.password")}
            </span>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 pr-11 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-emerald-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tr("admin.login.passwordPh")}
                required
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-zinc-400 transition-colors hover:text-emerald-400"
                aria-label={show ? tr("admin.login.hide") : tr("admin.login.show")}
                title={show ? tr("admin.login.hide") : tr("admin.login.show")}
              >
                {show ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </label>

          {captchaEnabled && (
            <div ref={captchaRef} className="flex justify-center" />
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full rounded-lg px-4 py-3 font-semibold text-emerald-950 disabled:opacity-60"
          >
            {loading ? tr("admin.login.checking") : tr("admin.login.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
