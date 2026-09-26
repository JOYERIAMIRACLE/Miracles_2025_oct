
import { useEffect, useState } from "react";

// "anillos-de-compromiso"/"churumbela" no son la relación categoria del
// producto — son un estilo marcado en atributos.tipoAnillo (ver
// app/(Tienda)/category/[categorySlug]/page.tsx, mismo mapeo).
const TIPO_ANILLO_POR_SLUG: Record<string, string[]> = {
  "anillos-de-compromiso": ["Compromiso", "Solitario", "Churumbela"],
  "churumbela": ["Churumbela"],
}

export function useGetCategoryProduct(slug: string | string[]) {
    const s = Array.isArray(slug) ? slug[0] : slug
    const catEnum = s.charAt(0).toUpperCase() + s.slice(1)
    const tipos = TIPO_ANILLO_POR_SLUG[s]
    const filtroCategoria = tipos
      ? tipos.map((t, i) => `filters[atributos][tipoAnillo][$in][${i}]=${encodeURIComponent(t)}`).join("&")
      : `filters[$or][0][categoria][slug][$eq]=${s}&filters[$or][1][categoriaJoya][$eq]=${encodeURIComponent(catEnum)}`
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products?populate=*` +
      `&${filtroCategoria}` +
      `&filters[activo][$eq]=true`
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")


    useEffect(() => {
        (async()=>{
            try {
                const res = await fetch(url);
                const json = await res.json();
                setResult(json.data) ;
                setLoading(false);          
            } catch (error: any){
                setError(error);
                setLoading(false);
            }
        })();
    }, [url]);

    return {loading, result, error};
}

