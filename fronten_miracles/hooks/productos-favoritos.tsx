import { ProductType } from "@/types/product"
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { toast } from "sonner"

interface FavoriteStore {
    items: ProductType[],
    addFavorite: (data: ProductType) => void,
    removeFavorite: (id: number) => void,
}

export const useFavorites = create(
  persist<FavoriteStore>(
    (set, get) => ({
      items: [],

      addFavorite: (data: ProductType) => {
        const currentItems = get().items
        const existingItem = currentItems.find((item) => item.id === data.id)

        if (existingItem) {
          return toast.info("Ya está en favoritos", {
            description: "Este producto ya forma parte de tu lista de deseos"
          })
        }

        set({
          items: [...get().items, data]
        })

        toast.success("Agregado a favoritos", {
          description: "El producto se guardó en tu lista ❤️"
        })
      },

      removeFavorite: (id: number) => {
        set({ items: get().items.filter((item) => item.id !== id) })
        toast.success("Eliminado de favoritos", {
          description: "El producto se quitó de tu lista"
        })
      },
    }),
    {
      name: "favorite-storage", // Nombre único para no chocar con el carrito
      storage: createJSONStorage(() => localStorage)
    }
  )
)