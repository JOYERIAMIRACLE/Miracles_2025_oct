"use client"

import { useGetCategoryProduct } from "@/api/getCategoryProduct"
import { useParams } from "next/navigation"
import { ResponseType } from "@/types/response"

export default function Page() {
    const params = useParams()
    const {categorySlug} = params
    console.log(categorySlug);
    const {result,loading, error}: ResponseType = useGetCategoryProduct(categorySlug)

    console.log(result)

    return (
        <p>fakdddddet</p>
    )
}