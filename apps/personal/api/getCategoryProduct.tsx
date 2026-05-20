
import { useEffect, useState } from "react";

export function useGetCategoryProduct(slug: string | string[]) {
    const s = Array.isArray(slug) ? slug[0] : slug
    const catEnum = s.charAt(0).toUpperCase() + s.slice(1)
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products?populate=*` +
      `&filters[$or][0][categoria][slug][$eq]=${s}` +
      `&filters[$or][1][categoriaJoya][$eq]=${encodeURIComponent(catEnum)}` +
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

