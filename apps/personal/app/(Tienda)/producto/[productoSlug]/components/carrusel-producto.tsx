"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { ArrowLeft, ArrowRight, X, ZoomIn } from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { ImageType } from "@/types/product"

interface CarouselProductoProps {
  imagenes: ImageType[]
}

function imgSrc(imagen: ImageType) {
  return imagen.url?.startsWith("http") ? imagen.url : `${process.env.NEXT_PUBLIC_BACKEND_URL}${imagen.url}`
}

function Lightbox({ imagenes, index, onClose, onNavigate }: {
  imagenes: ImageType[]; index: number; onClose: () => void; onNavigate: (i: number) => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") onNavigate((index + 1) % imagenes.length)
      if (e.key === "ArrowLeft") onNavigate((index - 1 + imagenes.length) % imagenes.length)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [index, imagenes.length, onClose, onNavigate])

  const imagen = imagenes[index]
  if (!imagen) return null

  // Portal directo a document.body: así el overlay siempre queda por encima
  // del navbar sticky de la tienda sin importar en qué stacking context viva
  // este componente dentro del árbol de la página.
  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 p-4 sm:p-10"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <button type="button" onClick={onClose} title="Cerrar"
        className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
        <X size={20} />
      </button>

      {imagenes.length > 1 && (
        <>
          <button type="button" title="Anterior"
            onClick={() => onNavigate((index - 1 + imagenes.length) % imagenes.length)}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <button type="button" title="Siguiente"
            onClick={() => onNavigate((index + 1) % imagenes.length)}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
            <ArrowRight size={20} />
          </button>
        </>
      )}

      <img
        src={imgSrc(imagen)}
        alt={imagen.alternativeText ?? "Imagen del producto"}
        className="max-w-full max-h-full object-contain rounded-lg"
        onClick={e => e.stopPropagation()}
      />

      {imagenes.length > 1 && (
        <p className="absolute bottom-4 sm:bottom-6 text-xs text-white/60 font-mono">
          {index + 1} / {imagenes.length}
        </p>
      )}
    </div>,
    document.body
  )
}

const CarouselProducto = ({ imagenes }: CarouselProductoProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (imagenes.length === 0) {
    return (
      <div className="w-full aspect-square rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
        <span className="text-6xl opacity-40">💍</span>
      </div>
    )
  }

  return (
    <div className="w-full sm:px-16">
      <Carousel>
        <CarouselContent>
          {imagenes.map((imagen, i) => (
            <CarouselItem key={imagen.id}>
              <button type="button" onClick={() => setLightboxIndex(i)} title="Ver imagen completa"
                className="group relative block w-full aspect-square overflow-hidden rounded-lg cursor-zoom-in">
                <img
                  src={imgSrc(imagen)}
                  alt={imagen.alternativeText ?? "Imagen producto"}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn size={16} />
                </span>
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>

      {lightboxIndex !== null && (
        <Lightbox
          imagenes={imagenes}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  )
}

export default CarouselProducto
