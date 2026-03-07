"use client"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/hooks/use-cart"
import { formatPrice } from "@/lib/formatprice"
import CartItem from "./components/cart-item"


export default function page() {
    const {items, removeAll} = useCart()
    const prices = items.map((producto => producto.costo))
    const totalPrice = prices.reduce((total,price)=> total + price, 0)



    return (
        <div className="max-w-6xl px-4 py-12 mx-auto sm:px-6 lg:px-8 dark:bg-zinc-900">
            <h1 className="mb-4 text-3xl font-bold">carrito de compra</h1>
            <div className=" grid sm:grid-cols-2 sm:gap-5">
                <div className="p-6 rounded-lg bg-slate-100 dark:text-black">
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
                    <div className="p-6 rounded-lg bg-slate-100 dark:text-black">
                        <p className="mb-3 text-lg font-semibold">Pedido </p>
                        <Separator className="dark:bg-black" />
                        <div className="flex justify-between gap-5 my-4 ">
                            <p>order total</p>
                            <p>{formatPrice(totalPrice)}</p>
                        </div>
                        <div className="flex items-center justify-center w-full mt-3">
                            <Button className="w-full dark:bg-black dark:text-white cursor-pointer" onClick={() => console.log("add pusrh")}>Proceder con la compra</Button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}   