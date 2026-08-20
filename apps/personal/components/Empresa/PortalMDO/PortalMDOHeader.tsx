"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Menu, Search, X as XIcon, Sun, Moon, Sparkles, LogOut, Bell, Camera } from "lucide-react"
import { GRUPOS } from "./PortalMDOSidebar"
import { logout } from "@/lib/auth"
import { useCurrentUser } from "@/lib/useCurrentUser"
import { useUploadImagen } from "./shared"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"

interface Props {
  onMenuClick: () => void
  onLogoClick: () => void
  onNavigate: (id: string, tab?: string) => void
}

interface Resultado { label: string; seccion: string; tab?: string; grupo: string }

function useIndiceBusqueda(): Resultado[] {
  return useMemo(() => {
    const out: Resultado[] = []
    for (const grupo of GRUPOS) {
      if (grupo.items.length === 0) {
        out.push({ label: grupo.label, seccion: grupo.id, grupo: grupo.label })
        continue
      }
      for (const item of grupo.items) {
        out.push({
          label: item.label,
          seccion: grupo.itemsAreOwnSection ? item.id : grupo.id,
          tab: grupo.itemsAreOwnSection ? undefined : item.id,
          grupo: grupo.label,
        })
      }
    }
    return out
  }, [])
}

function SearchResultsPanel({ results, onSelect }: { results: Resultado[]; onSelect: (r: Resultado) => void }) {
  if (results.length === 0) {
    return (
      <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-[200] p-4">
        <p className="text-xs text-slate-400 text-center">Sin resultados</p>
      </div>
    )
  }
  return (
    <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-[200] overflow-hidden max-h-72 overflow-y-auto">
      {results.map(r => (
        <button key={`${r.seccion}-${r.tab ?? ""}`} type="button" onClick={() => onSelect(r)}
          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{r.label}</p>
          <p className="text-[10px] text-slate-400">{r.grupo}</p>
        </button>
      ))}
    </div>
  )
}

function LogoEditable({ url, documentId, onUploaded }: { url?: string | null; documentId: string | null; onUploaded: () => void }) {
  const { uploading, inputRef, handleFile, trigger } = useUploadImagen("logo", documentId, onUploaded)
  return (
    <div className="relative h-9 w-9 shrink-0 rounded-lg bg-violet-600 flex items-center justify-center overflow-hidden group">
      {url ? <img src={url} alt="Logo" className="w-full h-full object-cover" /> : <Sparkles className="h-5 w-5 text-white" />}
      <button type="button" onClick={e => { e.stopPropagation(); trigger() }} disabled={uploading}
        title="Cambiar logo"
        className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/50 text-white opacity-0 group-hover:opacity-100 transition disabled:opacity-100">
        {uploading ? <span className="text-[8px] font-bold">...</span> : <Camera className="h-3.5 w-3.5" />}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

function ThemeToggleButton() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="h-9 w-9" />

  return (
    <button type="button" aria-label="Cambiar tema"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}

function AvatarCircle({ ini, className = "" }: { ini: string; className?: string }) {
  return (
    <div className={`w-full h-full rounded-full bg-linear-to-br from-violet-500 to-violet-600 flex items-center justify-center font-bold text-white ${className}`}>
      {ini}
    </div>
  )
}

function ProfileMenu() {
  const router = useRouter()
  const { user } = useCurrentUser()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const displayName = user?.username ?? user?.email?.split("@")[0] ?? ""
  const displaySub  = user?.email ?? ""
  const ini = displayName
    ? displayName.split(/[\s._-]+/).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?"
    : "?"

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} aria-label="Perfil"
        className="h-9 w-9 rounded-full overflow-hidden shrink-0 ring-2 ring-transparent hover:ring-violet-400 transition-all text-[11px]">
        <AvatarCircle ini={ini} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 text-sm">
              <AvatarCircle ini={ini} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{displayName || "Medallitadeoro"}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{displaySub || "Sesión activa"}</p>
            </div>
          </div>
          <div className="py-1">
            <button type="button" onClick={() => { logout(); router.push("/login") }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
              <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function NotifBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label="Notificaciones" onClick={() => setOpen(o => !o)}
        className={`relative h-9 w-9 rounded-lg flex items-center justify-center transition-colors ${open ? "bg-violet-50 dark:bg-violet-950/30 text-violet-500" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
        <Bell className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Notificaciones</span>
          </div>
          <div className="py-10 text-center">
            <p className="text-xs text-slate-400">Sin notificaciones activas</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function PortalMDOHeader({ onMenuClick, onLogoClick, onNavigate }: Props) {
  const indice = useIndiceBusqueda()
  const { identidad, reload } = useGetIdentidad()
  const [busqueda, setBusqueda]   = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const resultados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (q.length < 1) return []
    return indice.filter(r => r.label.toLowerCase().includes(q) || r.grupo.toLowerCase().includes(q)).slice(0, 8)
  }, [busqueda, indice])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  function selectResult(r: Resultado) {
    onNavigate(r.seccion, r.tab)
    setBusqueda("")
    setSearchOpen(false)
    setMobileSearchOpen(false)
  }

  return (
    <>
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-slate-700 shadow-sm flex items-center gap-2 sm:gap-3 px-2 sm:px-4 sticky top-0 z-50">
        <button type="button" title="Menú" onClick={onMenuClick}
          className="h-9 w-9 rounded flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0">
          <Menu className="h-5 w-5" />
        </button>
        <div role="button" tabIndex={0} onClick={onLogoClick}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onLogoClick() }}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity min-w-0 shrink-0 cursor-pointer">
          <LogoEditable url={identidad?.logo?.url} documentId={identidad?.documentId ?? null} onUploaded={reload} />
          <div className="min-w-0 text-left hidden sm:block">
            <div className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">Portal organizacional</div>
            <div className="text-[11px] text-slate-400 leading-none pt-0.5">Medallita de Oro</div>
          </div>
        </div>

        <div ref={searchRef} className="hidden sm:flex flex-1 justify-center px-8 relative">
          <div className="relative w-72">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <input
                value={busqueda}
                onChange={e => { setBusqueda(e.target.value); setSearchOpen(true) }}
                onKeyDown={e => { if (e.key === "Escape") { setBusqueda(""); setSearchOpen(false) } }}
                placeholder="Buscar sección, departamento…"
                className="bg-transparent text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 outline-none flex-1"
              />
              {busqueda && (
                <button type="button" onClick={() => { setBusqueda(""); setSearchOpen(false) }}>
                  <XIcon size={12} className="text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>
            {searchOpen && busqueda.trim().length >= 1 && (
              <SearchResultsPanel results={resultados} onSelect={selectResult} />
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button type="button" aria-label="Buscar"
            onClick={() => setMobileSearchOpen(o => !o)}
            className={`sm:hidden h-8 w-8 rounded flex items-center justify-center transition-colors ${mobileSearchOpen ? "bg-violet-50 dark:bg-violet-950/30 text-violet-500" : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
            <Search className="h-4 w-4" />
          </button>
          <ThemeToggleButton />
          <NotifBell />
          <ProfileMenu />
        </div>
      </header>

      {mobileSearchOpen && (
        <div className="sm:hidden sticky top-14 z-50 bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-slate-700 px-4 py-2.5">
          <div className="relative">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2">
              <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <input
                autoFocus
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                onKeyDown={e => { if (e.key === "Escape") { setBusqueda(""); setMobileSearchOpen(false) } }}
                placeholder="Buscar sección, departamento…"
                className="bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 outline-none flex-1"
              />
              {busqueda && (
                <button type="button" onClick={() => setBusqueda("")}>
                  <XIcon size={14} className="text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>
            {busqueda.trim().length >= 1 && (
              <SearchResultsPanel results={resultados} onSelect={selectResult} />
            )}
          </div>
        </div>
      )}
    </>
  )
}
