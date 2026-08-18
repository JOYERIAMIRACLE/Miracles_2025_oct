import { useEffect, useRef } from "react"

// Cierra el modal al hacer clic en el fondo (backdrop) SOLO si el formulario
// sigue igual que como se abrió — evita perder texto ya escrito por un clic
// accidental fuera del recuadro. Con cambios pendientes, hay que usar
// "Cancelar" o la X explícitamente.
export function useModalBackdropClose<T>(current: T, onClose: () => void, resetKey?: unknown) {
  const initialRef = useRef(current)

  useEffect(() => {
    initialRef.current = current
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  return (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    if (JSON.stringify(current) === JSON.stringify(initialRef.current)) onClose()
  }
}
