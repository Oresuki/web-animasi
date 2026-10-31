"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type Choice = "batu" | "gunting" | "kertas";
type Phase = "idle" | "thinking" | "result";

const CHOICES: { id: Choice; label: string; emoji: string }[] = [
  { id: "batu", label: "Batu", emoji: "✊" },
  { id: "gunting", label: "Gunting", emoji: "✌️" },
  { id: "kertas", label: "Kertas", emoji: "✋" },
];

/** Pilihan di kiri mengalahkan pilihan di kanan. */
const BEATS: Record<Choice, Choice> = {
  batu: "gunting",
  gunting: "kertas",
  kertas: "batu",
};

const LOOKUP = Object.fromEntries(
  CHOICES.map((c) => [c.id, c])
) as Record<Choice, (typeof CHOICES)[number]>;

// ====== Ubah hadiah sesuai keinginanmu ======
const PRIZE = {
  emoji: "🎁",
  title: "Hadiahmu: satu pelukan hangat",
  message: "Terima kasih sudah bermain. Kamu selalu menang di hatiku.",
};

const THINK_MS = 1000;
const SHUFFLE_MS = 110;
const BURST = Array.from({ length: 10 }, (_, i) => ({
  x: (i - 4.5) * 26,
  delay: i * 0.05,
}));

export function RpsGame() {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const [player, setPlayer] = useState<Choice | null>(null);
  const [opponent, setOpponent] = useState<Choice | null>(null);

  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const againRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  // Pindahkan fokus ke tombol "Main lagi" setelah hasil muncul
  useEffect(() => {
    if (phase === "result") againRef.current?.focus();
  }, [phase]);

  const play = (choice: Choice) => {
    if (phase === "thinking") return;

    setPlayer(choice);
    setPhase("thinking");

    if (reduceMotion) {
      setOpponent(null);
    } else {
      let i = 0;
      setOpponent(CHOICES[0].id);
      intervalRef.current = window.setInterval(() => {
        i = (i + 1) % CHOICES.length;
        setOpponent(CHOICES[i].id);
      }, SHUFFLE_MS);
    }

    timeoutRef.current = window.setTimeout(
      () => {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        // "Aku" selalu mengalah: pilih gerakan yang kalah dari pilihan pemain
        setOpponent(BEATS[choice]);
        setPhase("result");
      },
      reduceMotion ? 300 : THINK_MS
    );
  };

  const reset = () => {
    setPhase("idle");
    setPlayer(null);
    setOpponent(null);
  };

  const status =
    phase === "idle"
      ? "Pilih salah satu."
      : phase === "thinking"
        ? "Aku sedang memilih…"
        : player && opponent
          ? `Kamu pilih ${LOOKUP[player].label}, aku pilih ${LOOKUP[opponent].label}. Kamu menang!`
          : "";

  return (
    <section
      aria-labelledby="rps-title"
      className="mt-10 w-full max-w-md rounded-3xl bg-white/80 p-5 text-center text-[#3b2a2f] shadow-sm ring-1 ring-[#e9b6c5] sm:p-7"
    >
      <h2
        id="rps-title"
        className="text-xl font-semibold tracking-tight text-[#9b1b3d] sm:text-2xl"
      >
        Gunting Batu Kertas
      </h2>
      <p className="mt-1 text-sm text-[#6f2c42]">
        Aku selalu mengalah. Pilih saja, kamu pasti menang.
      </p>

      {/* Arena: label "Kamu" dan "Aku" berada di bawah masing-masing gestur */}
      <div
        aria-hidden="true"
        className="mt-6 flex items-start justify-center gap-4 sm:gap-8"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="grid size-24 place-items-center rounded-3xl bg-[#fbf7f1] text-6xl ring-1 ring-[#e9b6c5] sm:size-28 sm:text-7xl">
            {player ? LOOKUP[player].emoji : "❔"}
          </span>
          <span className="text-base font-semibold">Kamu</span>
        </div>

        <span className="grid h-24 place-items-center text-base font-semibold text-[#6f2c42] sm:h-28">
          VS
        </span>

        <div className="flex flex-col items-center gap-2">
          <span className="grid size-24 place-items-center rounded-3xl bg-[#fbf7f1] text-6xl ring-1 ring-[#e9b6c5] sm:size-28 sm:text-7xl">
            <motion.span
              key={opponent ?? "kosong"}
              initial={reduceMotion ? false : { y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.1 }}
            >
              {opponent ? LOOKUP[opponent].emoji : "❔"}
            </motion.span>
          </span>
          <span className="text-base font-semibold">Aku</span>
        </div>
      </div>

      <p role="status" aria-live="polite" className="mt-4 min-h-6 font-medium">
        {status}
      </p>

      {/* Pilihan */}
      {phase === "idle" && (
        <div
          role="group"
          aria-label="Pilih gerakanmu"
          className="mt-4 grid grid-cols-3 gap-3"
        >
          {CHOICES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => play(c.id)}
              className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl bg-[#fbf7f1] px-2 py-3 font-semibold text-[#7a1a38] ring-1 ring-[#e9b6c5] transition hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b1b3d] active:scale-100 motion-reduce:transition-none motion-reduce:hover:scale-100"
            >
              <span aria-hidden="true" className="text-4xl">
                {c.emoji}
              </span>
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Hasil + hadiah */}
      <AnimatePresence>
        {phase === "result" && (
          <motion.div
            key="prize"
            initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="relative mt-5"
          >
            {!reduceMotion && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
              >
                {BURST.map((b, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-2xl"
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
                    animate={{ x: b.x, y: -110, opacity: 0, scale: 1.2 }}
                    transition={{ duration: 1.4, delay: b.delay, ease: "easeOut" }}
                  >
                    💖
                  </motion.span>
                ))}
              </div>
            )}

            <div className="rounded-2xl bg-gradient-to-b from-rose-100 to-rose-50 p-5 ring-1 ring-rose-300 shadow-[0_10px_40px_-12px_rgba(224,70,106,0.5)]">
              <div aria-hidden="true" className="text-5xl">
                {PRIZE.emoji}
              </div>
              <p className="mt-2 text-lg font-semibold text-[#9b1b3d]">{PRIZE.title}</p>
              <p className="mt-1 text-sm text-[#6f2c42]">{PRIZE.message}</p>
            </div>

            <button
              ref={againRef}
              type="button"
              onClick={reset}
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[#9b1b3d] px-6 font-semibold text-white transition hover:bg-[#7f1531] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b1b3d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf7f1]"
            >
              Main lagi
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
