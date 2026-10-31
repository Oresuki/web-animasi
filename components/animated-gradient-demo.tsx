"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { motion, useReducedMotion } from "framer-motion";

import AnimatedGradientBackground from "@/components/ui/animated-gradient-background";

const LOTTIE_SRC =
  "https://lottie.host/8cf4ba71-e5fb-44f3-8134-178c4d389417/0CCsdcgNIP.json";

export function DemoVariant1() {
  const reduceMotion = useReducedMotion();

  return (
    <main className="relative isolate min-h-dvh w-full overflow-hidden bg-[#0A0A0A]">
      {/* Decorative gradient (aria-hidden, non-interactive) */}
      <AnimatedGradientBackground breathing />

      <section className="relative z-10 mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-start px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28 md:pt-32">
        {/* Lottie is decorative: hidden from screen readers, paused for reduced motion */}
        <div
          aria-hidden="true"
          className="w-full max-w-[16rem] sm:max-w-xs md:max-w-sm"
        >
          <DotLottieReact
            src={LOTTIE_SRC}
            loop={!reduceMotion}
            autoplay={!reduceMotion}
          />
        </div>

        {/* Dark glass panel keeps text readable over the bright gradient stops */}
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduceMotion ? 0.2 : 0.9,
            delay: reduceMotion ? 0 : 0.4,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="mt-4 rounded-2xl bg-black/60 px-5 py-4 shadow-lg ring-1 ring-white/10 backdrop-blur-md sm:px-8 sm:py-6"
        >
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">
            Animated Gradient Background
          </h1>
          <p className="mt-3 max-w-lg text-pretty text-base leading-relaxed text-gray-100 md:text-lg">
            A customizable animated radial gradient background with a subtle
            breathing effect.
          </p>
        </motion.div>
      </section>
    </main>
  );
}

export default DemoVariant1;
