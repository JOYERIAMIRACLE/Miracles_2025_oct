"use client"

import { Ship, Handshake, ShoppingCart, Truck, Boxes, Users } from "lucide-react"
import { useSectionTab, TabBar, Pending, SeccionHero, useHeroImagen } from "./shared"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"
import { ProveedoresView } from "@/components/Empresa/Compras/ProveedoresView"
import { ComprasView } from "@/components/Empresa/Compras/ComprasView"
import { EnviosView } from "@/components/Empresa/Suministro/EnviosView"
import { InventarioEmpresaView } from "@/components/Empresa/Almacen/InventarioEmpresaView"

const TABS = [
  { id: "importacion",  label: "Importación",  icon: Ship },
  { id: "proveedores",  label: "Proveedores",   icon: Handshake },
  { id: "compras",      label: "Compras",       icon: ShoppingCart },
  { id: "logistica",    label: "Logística",     icon: Truck },
  { id: "inventario",   label: "Inventario",    icon: Boxes },
  { id: "integrantes",  label: "Integrantes",   icon: Users },
]

export function SeccionCadenaSuministro() {
  const { tab, setTab } = useSectionTab("cadena", "proveedores")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]
  const { identidad, loading, reload } = useGetIdentidad()
  const documentId = identidad?.documentId ?? null
  const hero = useHeroImagen("portada_depto_cadena", documentId, reload)

  return (
    <div className="space-y-4">
      <SeccionHero
        breadcrumb={["Departamentos", "Cadena de suministro", activo.label]}
        titulo="Cadena de suministro"
        descripcion={identidad?.descripcion_depto_cadena || "Importación, proveedores, compras, logística e inventario de medallitadeoro."}
        campoDescripcion="descripcion_depto_cadena"
        onDescripcionGuardada={reload}
        imagenUrl={identidad?.portada_depto_cadena?.url}
        imagenOriginalUrl={identidad?.portada_depto_cadena_original?.url}
        documentId={documentId}
        puedeEditar={!loading}
        uploading={hero.uploading}
        inputRef={hero.inputRef}
        onTrigger={hero.trigger}
        onFileChange={hero.handleFile}
        onSaveCrop={hero.saveCrop}
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {tab === "importacion" && <Pending owner="Medallitadeoro" desc="Sin contenido todavía." />}
      {tab === "proveedores" && <ProveedoresView />}
      {tab === "compras"     && <ComprasView />}
      {tab === "logistica"   && <EnviosView />}
      {tab === "inventario"  && <InventarioEmpresaView />}
      {tab === "integrantes" && <Pending owner="Medallitadeoro" desc="Todavía no existe un directorio de colaboradores." />}
    </div>
  )
}
