export type IdentidadImagen = {
  url:    string
  width?: number
  height?: number
  mime?:  string
} | null

export type IdentidadEmpresa = {
  id:             number
  documentId:     string
  nombre:         string | null
  slogan:         string | null
  mision:         string | null
  vision:         string | null
  valores:        string | null
  colores:        string | null
  tipografia:     string | null
  sitioWeb:       string | null
  redesSociales:  string | null
  notas:          string | null
  descripcion_conoce:      string | null
  portada_conoce:          IdentidadImagen
  portada_conoce_original: IdentidadImagen
  foto_equipo:             IdentidadImagen
  imagen_mision:           IdentidadImagen
  imagen_vision:           IdentidadImagen
  telefono:       string | null
  correo:         string | null
  direccion:      string | null
  descripcion_depto_mision:      string | null
  portada_depto_mision:          IdentidadImagen
  portada_depto_mision_original: IdentidadImagen
  portada_principios: IdentidadImagen
  icono_principio_1:  IdentidadImagen
  icono_principio_2:  IdentidadImagen
  icono_principio_3:  IdentidadImagen
  icono_principio_4:  IdentidadImagen
  icono_principio_5:  IdentidadImagen
  img_orientador_1:   IdentidadImagen
  img_orientador_2:   IdentidadImagen
  img_orientador_3:   IdentidadImagen
  img_orientador_4:   IdentidadImagen
  img_valores_logo:   IdentidadImagen
  icono_valor_1:       IdentidadImagen
  icono_valor_2:       IdentidadImagen
  icono_valor_3:       IdentidadImagen
  icono_valor_4:       IdentidadImagen
  icono_valor_5:       IdentidadImagen
  logo:                IdentidadImagen
  descripcion_depto_rh:      string | null
  portada_depto_rh:          IdentidadImagen
  portada_depto_rh_original: IdentidadImagen
  descripcion_depto_cadena:      string | null
  portada_depto_cadena:          IdentidadImagen
  portada_depto_cadena_original: IdentidadImagen
  descripcion_depto_comercial:      string | null
  portada_depto_comercial:          IdentidadImagen
  portada_depto_comercial_original: IdentidadImagen
  descripcion_depto_marketing:      string | null
  portada_depto_marketing:          IdentidadImagen
  portada_depto_marketing_original: IdentidadImagen
  descripcion_depto_administracion:      string | null
  portada_depto_administracion:          IdentidadImagen
  portada_depto_administracion_original: IdentidadImagen
  descripcion_tareas:      string | null
  portada_tareas:          IdentidadImagen
  portada_tareas_original: IdentidadImagen
  descripcion_campanas:      string | null
  portada_campanas:          IdentidadImagen
  portada_campanas_original: IdentidadImagen
  descripcion_contactos:      string | null
  portada_contactos:          IdentidadImagen
  portada_contactos_original: IdentidadImagen
  portada_panel:              IdentidadImagen
  portada_panel_original:     IdentidadImagen
  descripcion_ventas:      string | null
  portada_ventas:          IdentidadImagen
  portada_ventas_original: IdentidadImagen
  descripcion_inventario:      string | null
  portada_inventario:          IdentidadImagen
  portada_inventario_original: IdentidadImagen
  descripcion_documentos:      string | null
  portada_documentos:          IdentidadImagen
  portada_documentos_original: IdentidadImagen
  descripcion_marca:      string | null
  portada_marca:          IdentidadImagen
  portada_marca_original: IdentidadImagen
  descripcion_enlaces:      string | null
  portada_enlaces:          IdentidadImagen
  portada_enlaces_original: IdentidadImagen
  descripcion_sitio_web:      string | null
  portada_sitio_web:          IdentidadImagen
  portada_sitio_web_original: IdentidadImagen
  indicador_objetivo_mensual: number | null
  indicador_producto:        number | null
  indicador_servicios:       number | null
  indicador_proyectos:       number | null
  createdAt?:     string
  updatedAt?:     string
}

export type IdentidadPayload = Omit<IdentidadEmpresa, "id" | "documentId" | "createdAt" | "updatedAt">
