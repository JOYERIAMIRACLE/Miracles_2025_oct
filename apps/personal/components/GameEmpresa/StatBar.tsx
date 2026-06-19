"use client"
import { motion } from "framer-motion"

const PALETTE = {
  hp: { bar: "from-emerald-600 to-emerald-400", text: "text-emerald-400", glow: "rgba(52,211,153,0.4)"  },
  mp: { bar: "from-blue-600 to-cyan-400",       text: "text-blue-400",    glow: "rgba(96,165,250,0.4)"  },
  xp: { bar: "from-amber-600 to-yellow-400",    text: "text-amber-400",   glow: "rgba(251,191,36,0.4)"  },
}

interface StatBarProps {
  label:        string
  current:      number
  max:          number
  color:        "hp" | "mp" | "xp"
  displayValue?: string
  className?:   string
}

export function StatBar({ label, current, max, color, displayValue, className = "" }: StatBarProps) {
  const pct   = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0
  const p     = PALETTE[color]
  const shown = displayValue ?? `${current}/${max}`

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-slate-600">{label}</span>
        <span className={`text-[9px] font-mono tabular-nums ${p.text}`}>{shown}</span>
      </div>
      <div
        className="h-1.5 w-full rounded-full overflow-hidden"
        style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.04)" }}
      >
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${p.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          style={{ boxShadow: `0 0 6px ${p.glow}` }}
        />
      </div>
    </div>
  )
}
