"use client"

// Singleton en memoria del módulo: coordina que solo un desplegable (de
// cualquier formulario, DropdownPicker/ComboboxPicker/CalendarioPicker) esté
// abierto a la vez. No usa Context/Provider a propósito, así funciona igual
// entre formularios que no comparten árbol de componentes.
type CloseFn = () => void

let openId: symbol | null = null
let openClose: CloseFn | null = null

export function requestOpen(id: symbol, close: CloseFn) {
  if (openId && openId !== id) openClose?.()
  openId = id
  openClose = close
}

export function notifyClosed(id: symbol) {
  if (openId === id) {
    openId = null
    openClose = null
  }
}
