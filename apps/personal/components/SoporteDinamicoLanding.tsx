"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

export function SoporteDinamicoLanding() {
  return (
    <div className="min-h-screen bg-[#111] text-white flex items-center justify-center overflow-hidden relative px-6">

      {/* Gradiente radial de fondo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_40%,rgba(237,128,0,0.10),transparent)] pointer-events-none" />

      {/* Triángulos decorativos — solo desktop */}
      <div className="hidden sm:block absolute bottom-0 right-0 pointer-events-none"
        style={{ width:0,height:0,borderStyle:"solid",borderWidth:"0 0 280px 240px",borderColor:"transparent transparent #ED8000 transparent",opacity:0.12 }} />
      <div className="hidden sm:block absolute bottom-0 right-0 pointer-events-none"
        style={{ width:0,height:0,borderStyle:"solid",borderWidth:"0 0 180px 150px",borderColor:"transparent transparent #ED8000 transparent",opacity:0.08,transform:"translate(-70px,0)" }} />

      {/* Contenido centrado */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center text-center gap-8 max-w-lg w-full"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl flex items-center justify-center bg-white shadow-2xl shadow-black/30"
        >
          <Image
            src="/logo-sdi.png"
            alt="Soporte Dinámico Industrial"
            width={140}
            height={140}
            className="w-28 h-28 sm:w-36 sm:h-36 object-contain"
            priority
          />
        </motion.div>

        {/* Textos */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col items-center gap-3"
        >
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-none">
            Soporte Dinámico<br />
            <span className="text-[#ED8000]">Industrial</span>
          </h1>
          <p className="text-white/50 text-base tracking-widest font-medium">
            Solucionar · Simplificar · Servir
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <Link href="/portal">
            <button type="button"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base text-white bg-[#ED8000] hover:bg-[#d47200] active:scale-95 transition-all shadow-lg shadow-orange-500/20">
              Acceder al portal
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </motion.div>
      </motion.div>

    </div>
  )
}
