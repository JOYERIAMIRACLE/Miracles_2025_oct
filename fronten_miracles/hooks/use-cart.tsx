import { ProductType } from "@/types/product"
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { Toaster } from "@/components/ui/sonner"
import { get } from "http"

interface CartStore {
  items: ProductType[],
  addItem: (data: ProductType) => void,
  removeItem: (id: number) => void,
  removeAll: () => void,

}

export const useCart = create(persist<CartStore>((set, get)  => ({
    items: [],
    addItem: (data: ProductType) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(item) => item.id === data.id);
        if(existingItem) {
            return toast({
                title: "Producto ya en el carrito",
                description: "El producto ya se encuentra en el carrito",
                variant: "destructive"
            })
        }   
        set({
            items: [...get().items, data]
        })


            })
}