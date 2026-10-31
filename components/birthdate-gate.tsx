"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Caveat, Dancing_Script } from "next/font/google";

/* ============================================================================
 * ATURAN VALIDASI
 * Hanya FORMAT yang diperiksa: tanggal harus benar-benar ada di kalender.
 * Tanggal lahir apa pun yang valid boleh masuk (tidak ada tanggal rahasia).
 * ========================================================================== */

// <validate>
const MIN_YEAR = 1900;
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export type BirthdateResult =
  | { ok: true }
  | { ok: false; message: string; field: "day" | "month" | "year" | "all" };

/** `digits` = 8 angka berurutan: DDMMYYYY. */
export function validateBirthdate(digits: string, now: Date = new Date()): BirthdateResult {
  if (!/^\d{8}$/.test(digits)) {
    return { ok: false, field: "all", message: "Lengkapi tanggal, bulan, dan tahun (8 angka)." };
  }

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  const maxYear = now.getFullYear();

  if (month < 1 || month > 12) {
    return { ok: false, field: "month", message: "Bulan harus antara 01 sampai 12." };
  }
  if (year < MIN_YEAR || year > maxYear) {
    return { ok: false, field: "year", message: `Tahun harus antara ${MIN_YEAR} dan ${maxYear}.` };
  }

  // Hari terakhir bulan itu (sudah memperhitungkan tahun kabisat).
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return {
      ok: false,
      field: "day",
      message: `Tanggal harus 01 sampai ${daysInMonth} untuk ${MONTHS[month - 1]} ${year}.`,
    };
  }

  const birth = new Date(year, month - 1, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (birth > today) {
    return { ok: false, field: "all", message: "Tanggal lahir tidak boleh di masa depan." };
  }

  return { ok: true };
}
// </validate>

/* ============================================================================
 * Tampilan
 * ========================================================================== */

const script = Dancing_Script({
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});
const hand = Caveat({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const INK = "#9b1b3d";
const INK_SOFT = "#6f2c42";

const CONTENT = {
  title: "Ini untukmu, sayangku",
  subtitle: "Masukkan tanggal lahirmu untuk membuka",
  openLabel: "Ketuk untuk membuka",
};

const GROUPS = [
  { key: "day", label: "Tanggal", start: 0, len: 2 },
  { key: "month", label: "Bulan", start: 2, len: 2 },
  { key: "year", label: "Tahun", start: 4, len: 4 },
] as const;

const CSS = `
@keyframes bd-shake{0%,100%{transform:translateX(0)}15%{transform:translateX(-10px)}30%{transform:translateX(9px)}45%{transform:translateX(-7px)}60%{transform:translateX(6px)}75%{transform:translateX(-3px)}}
@keyframes bd-beat{0%,100%{transform:scale(1)}14%{transform:scale(1.14)}28%{transform:scale(1)}42%{transform:scale(1.1)}70%{transform:scale(1)}}
.bd-shake{animation:bd-shake .45s ease-in-out}
.bd-beat{animation:bd-beat 1.6s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.bd-shake,.bd-beat{animation:none}}
`;

const STORAGE_KEY = "birthdate-gate-unlocked";

/**
 * Bungkus konten yang ingin dikunci:
 *   <BirthdateGate><HalamanAwal /></BirthdateGate>
 *
 * - remember (default true): setelah terbuka, gerbang tidak muncul lagi selama
 *   tab masih dibuka (mis. saat kembali dari halaman lain). Tab baru = diminta lagi.
 * - backHref: jika diisi, tampil tombol "Kembali" di layar gerbang.
 */
export function BirthdateGate({
  children,
  remember = true,
  backHref,
}: {
  children: ReactNode;
  remember?: boolean;
  backHref?: string;
}) {
  // "checking" = belum tahu; dirender sebagai layar krem polos agar tidak berkedip.
  const [status, setStatus] = useState<"checking" | "locked" | "unlocked">("checking");

  useEffect(() => {
    let saved = false;
    if (remember) {
      try {
        saved = window.sessionStorage.getItem(STORAGE_KEY) === "1";
      } catch {
        saved = false; // penyimpanan diblokir: tetap minta tanggal
      }
    }
    setStatus(saved ? "unlocked" : "locked");
  }, [remember]);

  const handleUnlock = useCallback(() => {
    if (remember) {
      try {
        window.sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* abaikan */
      }
    }
    setStatus("unlocked");
  }, [remember]);

  return (
    <AnimatePresence mode="wait">
      {status === "checking" && (
        <div key="checking" className="min-h-dvh bg-[#fbf7f1]" aria-hidden="true" />
      )}
      {status === "locked" && (
        <Gate key="gate" onUnlock={handleUnlock} backHref={backHref} />
      )}
      {status === "unlocked" && <Unlocked key="content">{children}</Unlocked>}
    </AnimatePresence>
  );
}

export default BirthdateGate;

/** Setelah terbuka, pindahkan titik awal fokus keyboard ke konten. */
function Unlocked({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div ref={ref} tabIndex={-1} className="outline-none">
      {children}
    </div>
  );
}

function Gate({ onUnlock, backHref }: { onUnlock: () => void; backHref?: string }) {
  const reduce = !!useReducedMotion();
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<Extract<BirthdateResult, { ok: false }> | null>(null);
  const [shake, setShake] = useState(false);

  const add = useCallback((d: string) => {
    setError(null);
    setDigits((v) => (v.length < 8 ? v + d : v));
  }, []);

  const del = useCallback(() => {
    setError(null);
    setDigits((v) => v.slice(0, -1));
  }, []);

  const submit = useCallback(() => {
    const result = validateBirthdate(digits);
    if (result.ok) {
      onUnlock();
      return;
    }
    setError(result);
    if (!reduce) setShake(true);
  }, [digits, onUnlock, reduce]);

  // Keyboard fisik: angka, Backspace, Enter.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (/^\d$/.test(e.key)) {
        add(e.key);
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        del();
        return;
      }
      if (e.key === "Enter") {
        // Jika fokus ada di tombol/tautan, biarkan perilaku bawaannya.
        const target = e.target as HTMLElement | null;
        if (target?.closest("button, a")) return;
        e.preventDefault();
        submit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [add, del, submit]);

  const spoken = digits
    ? `Terisi: ${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`.trim()
    : "";

  return (
    <motion.main
      className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#fbf7f1] px-3 py-20 text-[#3b2a2f]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: "none" }}
      transition={{ duration: 0.5 }}
    >
      <style>{CSS}</style>

      {backHref && (
        <Link
          href={backHref}
          className="absolute left-4 top-4 z-10 inline-flex min-h-11 items-center rounded-full bg-white/85 px-4 text-sm font-semibold text-[#7a1a38] ring-1 ring-[#e9b6c5] backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b1b3d]"
        >
          <span aria-hidden="true" className="mr-1.5">←</span> Kembali
        </Link>
      )}

      <div
        className={`w-full max-w-sm ${shake ? "bd-shake" : ""}`}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) setShake(false);
        }}
      >
        <section
          aria-labelledby="gate-title"
          className="rounded-[2rem] bg-white/50 p-5 text-center shadow-[0_24px_60px_-30px_rgba(155,27,61,0.35)] ring-1 ring-[#efe4dc] sm:p-7"
        >
          {/* Ikon hati */}
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 100 100"
            className="bd-beat mx-auto size-10"
          >
            <defs>
              <linearGradient id="bd-love" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ff7aa2" />
                <stop offset="0.55" stopColor="#ff2d55" />
                <stop offset="1" stopColor="#b0003a" />
              </linearGradient>
            </defs>
            <path
              d="M50 88C20 66 6 48 6 31C6 18 16 9 28 9C38 9 46 15 50 22C54 15 62 9 72 9C84 9 94 18 94 31C94 48 80 66 50 88Z"
              fill="url(#bd-love)"
            />
          </svg>

          <h1
            id="gate-title"
            className={`${script.className} mt-2 text-balance text-3xl font-medium sm:text-4xl`}
            style={{ color: INK }}
          >
            {CONTENT.title}
          </h1>
          <p className={`${hand.className} mt-1 text-xl`} style={{ color: INK_SOFT }}>
            {CONTENT.subtitle}
          </p>

          {/* Tampilan angka: tanggal / bulan / tahun */}
          <div
            role="group"
            aria-label="Tanggal lahir: tanggal, bulan, tahun"
            className="mt-5 flex items-start gap-1.5"
          >
            {GROUPS.map((g, gi) => (
              <Fragment key={g.key}>
                {gi > 0 && (
                  <span
                    aria-hidden="true"
                    className="mt-2.5 w-2 shrink-0 text-center text-lg text-[#c98a9b]"
                  >
                    /
                  </span>
                )}
                <div
                  className={`flex min-w-0 flex-col gap-1.5 ${g.len === 4 ? "flex-[4]" : "flex-[2]"}`}
                >
                  <div className="flex gap-1">
                    {Array.from({ length: g.len }, (_, k) => {
                      const idx = g.start + k;
                      const char = digits[idx];
                      const isActive = idx === digits.length;
                      const isBad = !!error && (error.field === g.key || error.field === "all");
                      const ring = isBad
                        ? "ring-2 ring-[#d6335a]"
                        : isActive
                          ? "ring-2 ring-[#9b1b3d]"
                          : "ring-1 ring-[#e9b6c5]";
                      return (
                        <span
                          key={idx}
                          aria-hidden="true"
                          className={`grid h-12 min-w-0 max-w-10 flex-1 place-items-center rounded-xl bg-white/80 text-xl font-semibold tabular-nums text-[#7a1a38] ${ring}`}
                        >
                          {char ?? ""}
                        </span>
                      );
                    })}
                  </div>
                  <span className="text-center text-xs font-medium text-[#6f2c42]">
                    {g.label}
                  </span>
                </div>
              </Fragment>
            ))}
          </div>

          {/* Pesan galat (juga dibacakan screen reader) */}
          <p role="alert" className="mt-3 min-h-10 text-sm font-medium text-[#9b1b3d]">
            {error?.message}
          </p>
          <p className="sr-only" aria-live="polite">
            {spoken}
          </p>

          {/* Keypad */}
          <div className="mx-auto mt-2 grid max-w-[16rem] grid-cols-3 justify-items-center gap-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
              <KeyButton key={k} onClick={() => add(k)}>
                {k}
              </KeyButton>
            ))}
            <span aria-hidden="true" />
            <KeyButton onClick={() => add("0")}>0</KeyButton>
            <KeyButton onClick={del} label="Hapus angka terakhir">
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 24 24"
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6-7z" />
                <path d="m13 10 4 4m0-4-4 4" />
              </svg>
            </KeyButton>
          </div>

          <button
            type="button"
            onClick={submit}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#9b1b3d] px-6 font-semibold text-white shadow-lg shadow-rose-900/20 transition hover:bg-[#7f1531] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b1b3d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf7f1]"
          >
            {CONTENT.openLabel}
          </button>
        </section>
      </div>
    </motion.main>
  );
}

function KeyButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-14 place-items-center rounded-full bg-white text-xl font-semibold text-[#7a1a38] shadow-sm ring-1 ring-[#e9b6c5] transition hover:bg-[#fff0f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b1b3d] active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
    >
      {children}
    </button>
  );
}
