"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false
  );
}

type Variant = "heart" | "broken";

const GLOW: Record<Variant, string> = {
  heart:
    "hover:border-rose-400 hover:shadow-[0_14px_50px_-12px_rgba(224,70,106,0.55)] focus-visible:border-rose-400 focus-visible:shadow-[0_14px_50px_-12px_rgba(224,70,106,0.55)]",
  broken:
    "hover:border-slate-400 hover:shadow-[0_14px_50px_-12px_rgba(108,127,166,0.6)] focus-visible:border-slate-400 focus-visible:shadow-[0_14px_50px_-12px_rgba(108,127,166,0.6)]",
};

interface LottieChoiceCardProps {
  href: string;
  label: string;
  description: string;
  /** URL / path file Lottie (.lottie atau .json). Kosong = tampilkan ilustrasi cadangan. */
  src: string;
  variant: Variant;
}

export function LottieChoiceCard({
  href,
  label,
  description,
  src,
  variant,
}: LottieChoiceCardProps) {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <Link
      href={href}
      aria-label={`${label}: ${description}`}
      className={[
        "group relative flex flex-col items-center gap-3 rounded-3xl border border-[#efe4dc]",
        "bg-white/50 p-3 sm:gap-5 sm:p-8",
        "transition duration-300 ease-out",
        "hover:scale-105 hover:bg-white focus-visible:scale-105 focus-visible:bg-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b1b3d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf7f1]",
        "active:scale-100",
        "motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:focus-visible:scale-100",
        GLOW[variant],
      ].join(" ")}
    >
      {/* Animasi bersifat dekoratif; makna disampaikan lewat aria-label link */}
      <div aria-hidden="true" className="aspect-square w-full">
        {src ? (
          <DotLottieReact
            src={src}
            loop={!reduceMotion}
            autoplay={!reduceMotion}
            className="h-full w-full"
          />
        ) : (
          <FallbackArt variant={variant} />
        )}
      </div>

      <div className="text-center">
        <h2 className="text-lg font-semibold tracking-tight text-[#9b1b3d] sm:text-2xl">
          {label}
        </h2>
        <p className="mt-1 hidden text-sm text-[#6f2c42] sm:block">
          {description}
        </p>
      </div>
    </Link>
  );
}

/** Ilustrasi cadangan agar halaman tetap bagus sebelum link Lottie diisi. */
function FallbackArt({ variant }: { variant: Variant }) {
  if (variant === "heart") {
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full p-[12%]">
        <defs>
          <linearGradient id="fbLove" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ff7aa2" />
            <stop offset="0.55" stopColor="#ff2d55" />
            <stop offset="1" stopColor="#b0003a" />
          </linearGradient>
        </defs>
        <path
          className="origin-center animate-pulse motion-reduce:animate-none"
          style={{ transformBox: "fill-box" }}
          d="M50 88C20 66 6 48 6 31C6 18 16 9 28 9C38 9 46 15 50 22C54 15 62 9 72 9C84 9 94 18 94 31C94 48 80 66 50 88Z"
          fill="url(#fbLove)"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full p-[12%]">
      <defs>
        <linearGradient id="fbSad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a9b8d6" />
          <stop offset="0.55" stopColor="#6c7fa6" />
          <stop offset="1" stopColor="#3a4668" />
        </linearGradient>
      </defs>
      <g transform="translate(-3 1) rotate(-6 50 88)">
        <path
          d="M50 88C20 66 6 48 6 31C6 18 16 9 28 9C38 9 46 15 50 22L44 38L54 50L45 63L52 74Z"
          fill="url(#fbSad)"
        />
      </g>
      <g transform="translate(3 1) rotate(6 50 88)">
        <path
          d="M50 88L52 74L45 63L54 50L44 38L50 22C54 15 62 9 72 9C84 9 94 18 94 31C94 48 80 66 50 88Z"
          fill="url(#fbSad)"
        />
      </g>
    </svg>
  );
}