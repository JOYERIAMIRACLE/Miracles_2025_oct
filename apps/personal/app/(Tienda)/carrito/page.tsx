"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/hooks/useCart"
import { useClienteAuth } from "@/hooks/useClienteAuth"
import { formatPrice } from "@/lib/formatprice"
import { getClienteToken } from "@/lib/tiendaAuth"
import CartItem from "./components/cart-item"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export default function page() {
    const router = useRouter()
    const { items, removeAll } = useCart()
    const { cliente, loading: cargandoCliente } = useClienteAuth()
    const [enviando, setEnviando] = useState(false)
    const prices = items.map((producto => producto.costo ?? 0))
    const totalPrice = prices.reduce((total, price) => total + price, 0)

    async function procederCompra() {
        if (!cliente) {
            router.push("/cuenta/registro?next=/carrito")
            return
        }
        setEnviando(true)
        try {
            const payload = items.map(p => ({
                productoId: p.documentId ?? null,
                nombre:     p.nombreProducto,
                sku:        p.sku ?? null,
                precio:     p.costo ?? 0,
                cantidad:   1,
            }))
            const res = await fetch(`${BASE}/api/tienda/checkout-intento`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getClienteToken()}`,
                },
                body: JSON.stringify({ items: payload }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error?.message ?? "Error al procesar")
            removeAll()
            toast.success("¡Solicitud enviada!", {
                description: "Tu pedido fue registrado. Te contactamos pronto por WhatsApp para confirmar.",
            })
            router.push("/cuenta/cotizaciones")
        } catch (err) {
            toast.error("No se pudo procesar", {
                description: (err as Error).message,
            })
        } finally {
            setEnviando(false)
        }
    }



    return (
        <div className="max-w-6xl px-4 py-12 mx-auto sm:px-6 lg:px-8 bg-white dark:bg-zinc-900">
            <h1 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">Carrito de compra</h1>
            <div className=" grid sm:grid-cols-2 sm:gap-5">
                <div className="p-6 rounded-lg bg-slate-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                    {items.length === 0 && (
                        <p>No hay productos en el carrito</p>
                    )}
                    <ul>
                        {items.map((item) => (
                            <CartItem key={item.id} producto={item} />
                        ))}
                    </ul>
                </div>
                <div className="max-w-xl">
                    <div className="p-6 rounded-lg bg-slate-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                        <p className="mb-3 text-lg font-semibold">Pedido</p>
                        <Separator className="dark:bg-zinc-700" />
                        <div className="flex justify-between gap-5 my-4 ">
                            <p>Total del pedido</p>
                            <p className="font-semibold">{formatPrice(totalPrice)}</p>
                        </div>
                        <div className="flex items-center justify-center w-full mt-3">
                            <Button
                                className="w-full cursor-pointer bg-amber-600 hover:bg-amber-700 text-white"
                                disabled={items.length === 0 || cargandoCliente || enviando}
                                onClick={procederCompra}
                            >
                                {enviando ? "Enviando…" : cliente ? "Solicitar cotización" : "Crear cuenta para continuar"}
                            </Button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}