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
  createdAt?:     string
  updatedAt?:     string
}

export type IdentidadPayload = Omit<IdentidadEmpresa, "id" | "documentId" | "createdAt" | "updatedAt">
