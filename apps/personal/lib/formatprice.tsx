export function formatPrice(costo: number | null | undefined) {
    const priceFormated = new Intl.NumberFormat('es-MX', {
        style: "currency",
        currency: "MXN"
    })

    return priceFormated.format(costo ?? 0)
}