"use client"

import { Boxes, Scale, Truck, BookOpen } from "lucide-react"
import { useSectionTab, SeccionVitrina, ContenidoTabs, SeccionHeroContenido, useHeroImagen } from "./shared"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"
import { InventarioEmpresaView } from "@/components/Empresa/Almacen/InventarioEmpresaView"
import { MateriaPrimaView } from "@/components/Empresa/Compras/MateriaPrimaView"
import { EnviosView } from "@/components/Empresa/Suministro/EnviosView"
import { CatalogoJoyeriaView } from "@/components/Empresa/Suministro/CatalogoJoyeriaView"

const TABS = [
  { id: "materiaprima", label: "Compras",   icon: Scale    },
  { id: "productos",    label: "Productos", icon: Boxes    },
  { id: "catalogo",     label: "Catálogo",  icon: BookOpen },
  { id: "logistica",    label: "Logística", icon: Truck    },
]

export function SeccionInventario() {
  const { tab, setTab } = useSectionTab("inventario", "materiaprima")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]
  const { identidad, loading, reload } = useGetIdentidad()
  const documentId = identidad?.documentId ?? null
  const hero = useHeroImagen("portada_inventario", documentId, reload)

  return (
    <SeccionVitrina>
      <SeccionHeroContenido
        breadcrumb={["Operación", "Inventario", activo.label]}
        titulo="Inventario"
        descripcion={identidad?.descripcion_inventario || "Compras, producto terminado, catálogo de SKUs y logística."}
        campoDescripcion="descripcion_inventario"
        onDescripcionGuardada={reload}
        documentId={documentId}
        puedeEditar={!loading}
      >
        <ContenidoTabs tabs={TABS} active={tab} onChange={setTab} />
      </SeccionHeroContenido>
      {tab === "materiaprima" && <MateriaPrimaView />}
      {tab === "productos"    && <InventarioEmpresaView />}
      {tab === "catalogo"     && <CatalogoJoyeriaView />}
      {tab === "logistica"    && <EnviosView />}
    </SeccionVitrina>
  )
}
