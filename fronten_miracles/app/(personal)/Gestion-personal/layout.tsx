import { ReactNode } from "react"
import { AdminSidebar } from "@/components/AdminPersonal/AdminSidebar"
import { AdminHeader } from "@/components/AdminPersonal/AdminHeader"

export default function GestionPersonalLayout({ children }: { children: ReactNode }) {
    // Este layout se ejecuta en el SEVIDOR (RSC) por defecto. No necesitamos use client.

    return (
        <div className="flex min-h-screen bg-zinc-50/50 dark:bg-zinc-950/50">
            {/* Sidebar Fija (en pantallas de PC) */}
            <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 z-50 w-64 border-r bg-background">
                <AdminSidebar />
            </aside>

            {/* Contenedor Principal. A la derecha le damos espacio al Sidebar (md:pl-64) */}
            <div className="md:pl-64 flex flex-col flex-1 min-w-0">
                <AdminHeader />
                <main className="flex-1 p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
