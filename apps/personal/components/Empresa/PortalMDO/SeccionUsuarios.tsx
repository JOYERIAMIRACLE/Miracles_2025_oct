"use client"

import { useState } from "react"
import { Plus, X, Loader2, Users, Search, Mail, CheckCircle, XCircle, Lock, Unlock } from "lucide-react"
import { toast } from "sonner"
import { useGetUsuariosPortal, invitarUsuario, bloquearUsuario, desbloquearUsuario } from "@/api/portalUsuarios/getUsuarios"

const inp = "w-full h-9 rounded-lg border border-slate-700 bg-[#2a1b3d] px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"

export function SeccionUsuarios() {
  const { usuarios, setUsuarios, loading } = useGetUsuariosPortal()
  const [search,    setSearch]    = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [username,  setUsername]  = useState("")
  const [email,     setEmail]     = useState("")
  const [saving,    setSaving]    = useState(false)
  const [toggling,  setToggling]  = useState<number | null>(null)

  const filtrados = usuarios.filter(u =>
    !search || u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  function openNuevo() { setUsername(""); setEmail(""); setModalOpen(true) }

  async function handleInvitar() {
    if (!username.trim() || !email.trim()) { toast.error("Nombre y correo son obligatorios"); return }
    setSaving(true)
    try {
      const nuevo = await invitarUsuario(username, email)
      setUsuarios(prev => [...prev, nuevo].sort((a, b) => a.username.localeCompare(b.username)))
      toast.success("Invitación enviada — le llegará un correo para definir su contraseña")
      setModalOpen(false)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(u: { id: number; blocked: boolean }) {
    setToggling(u.id)
    try {
      if (u.blocked) {
        await desbloquearUsuario(u.id)
        setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, blocked: false } : x))
        toast.success("Usuario desbloqueado")
      } else {
        await bloquearUsuario(u.id)
        setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, blocked: true } : x))
        toast.success("Usuario bloqueado")
      }
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <Users size={18} className="text-violet-400" />
          <div>
            <h1 className="text-xl font-bold text-slate-100">Usuarios del Portal</h1>
            <p className="text-[11px] text-slate-500">{usuarios.length} registrados · {usuarios.filter(u => !u.blocked).length} activos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
              className="pl-8 pr-3 h-8 rounded-lg border border-slate-700 bg-[#2a1b3d] text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-violet-500/40 w-44" />
          </div>
          <button type="button" onClick={openNuevo}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition">
            <Plus size={13} /> Invitar usuario
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-[#2a1b3d] border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-[#2a1b3d]/50">
              <tr>
                {["Nombre", "Email", "Estado", ""].map(h => (
                  <th key={h} className="h-9 px-4 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 4 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-[#2a1b3d] animate-pulse w-3/4" /></td>
                ))}</tr>
              ))}
              {!loading && filtrados.map(u => (
                <tr key={u.id} className="hover:bg-[#2a1b3d]/40 transition-colors group">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-200">{u.username}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    <a href={`mailto:${u.email}`} className="flex items-center gap-1 hover:text-violet-400 transition"><Mail size={11}/>{u.email}</a>
                  </td>
                  <td className="px-4 py-3">
                    {!u.blocked
                      ? <span className="flex items-center gap-1 text-[11px] text-violet-400"><CheckCircle size={11}/>Activo</span>
                      : <span className="flex items-center gap-1 text-[11px] text-slate-600"><XCircle size={11}/>Bloqueado</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => handleToggle(u)} disabled={toggling === u.id}
                      className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-slate-700 text-[11px] text-slate-400 hover:text-slate-200 hover:border-slate-600 transition disabled:opacity-50 opacity-0 group-hover:opacity-100">
                      {toggling === u.id
                        ? <Loader2 size={11} className="animate-spin"/>
                        : u.blocked ? <Unlock size={11}/> : <Lock size={11}/>}
                      {u.blocked ? "Desbloquear" : "Bloquear"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtrados.length === 0 && (
            <div className="py-12 text-center">
              <Users size={28} className="mx-auto mb-2 text-slate-700" />
              <p className="text-slate-600 text-sm">{search ? "Sin resultados." : "Sin usuarios registrados."}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal invitar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-md bg-[#2a1b3d] border border-slate-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100">Invitar usuario</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-500 hover:text-slate-300 rounded"><X size={15}/></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">Nombre *</label>
                <input className={inp} placeholder="Ej. Ana Pérez" value={username} onChange={e => setUsername(e.target.value)} />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">Correo *</label>
                <input className={inp} type="email" placeholder="ana@medalladeoro.com.mx" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Se crea la cuenta y le llega un correo para que defina su propia contraseña — no necesitas dictarle ninguna.
              </p>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-800">
              <button type="button" onClick={() => setModalOpen(false)} className="h-8 px-4 rounded-lg border border-slate-700 text-xs text-slate-400 hover:text-slate-200 transition">Cancelar</button>
              <button type="button" onClick={handleInvitar} disabled={saving}
                className="h-8 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition disabled:opacity-50 flex items-center gap-1.5">
                {saving && <Loader2 size={11} className="animate-spin"/>}
                Enviar invitación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
