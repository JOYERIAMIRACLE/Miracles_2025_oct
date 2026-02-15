import { ProductType } from "@/types/product"
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { toast } from "sonner"

interface CartStore {
  items: ProductType[],
  addItem: (data: ProductType) => void,
  removeItem: (id: number) => void,
  removeAll: () => void,

}

export const useCart = create (
    persist<CartStore>(
        (set, get)  => ({
            items: [],

            addItem: (data: ProductType) => {
            const currentItems = get().items
            const existingItem = currentItems.find((item) => item.id === data.id);


            if(existingItem) {
                return toast.error("Producto ya en el carrito", {
                    description: "El producto ya se encuentra en el carrito"
                })
            }
        
        
            set({
                items: [...get().items, data]
            })

            toast.success("Producto agregado", {
                description: "El producto se ha agregado al carrito"
            })
        },
        removeItem: (id: number) => {
            set({items: get().items.filter((item) => item.id !== id)})
            toast.success("Producto eliminado", {
                description: "El producto se ha eliminado del carrito"
            })
        },
        removeAll: () => {
            set({items: []})
            toast.success("Carrito vaciado", {
                description: "Todos los productos se han eliminado del carrito"
            })
        }
        }),
        {
            name: "cart-storage",
            storage: createJSONStorage(() => localStorage)
        }
    )
)