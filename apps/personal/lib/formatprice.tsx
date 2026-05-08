export function formatPrice(costo: number) {
    const priceFormated = new Intl.NumberFormat('es-MX', {
        style: "currency",
        currency: "MXN"
    })

    const finalPrice = priceFormated.format(costo)

    return finalPrice   
}