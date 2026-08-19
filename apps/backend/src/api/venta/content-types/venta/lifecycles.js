'use strict';

// Lifecycles de Venta (pedido)
// Descuenta product.stock automáticamente cuando el pedido pasa a un estado
// confirmado (todo menos "Cotizado"/"Cancelado") y lo restaura si vuelve a
// alguno de esos dos o si el pedido se elimina — mismo patrón de ledger que
// transaccion/cuenta.saldoActual y movimiento-material/material.stockGramos.
//
// Nota: las líneas (venta-linea) se crean con una llamada aparte DESPUÉS de
// crear el pedido — por eso el pedido siempre nace en estado "Cotizado"
// (sin efecto de stock) y el frontend hace un update posterior al estado
// real una vez que las líneas ya existen, igual que compra-material nace
// "borrador" y solo al "recibir" (acción separada) aplica sus efectos.

const ESTADOS_SIN_STOCK = new Set(['Cotizado', 'Cancelado']);

function aplicaStock(estado) {
  return !ESTADOS_SIN_STOCK.has(estado);
}

function getRelId(rel) {
  if (!rel) return null;
  if (typeof rel === 'number') return rel;
  if (typeof rel === 'object' && rel.id) return rel.id;
  return null;
}

async function loadFull(id) {
  if (!id) return null;
  return strapi.db.query('api::venta.venta').findOne({
    where: { id },
    populate: { lineas: { populate: ['producto'] }, producto: true },
  });
}

// [{ productoId, cantidad }] — usa las líneas reales si existen, si no cae
// al par producto/cantidad heredado (ventas simples de un solo producto).
function lineasDe(venta) {
  if (venta.lineas && venta.lineas.length > 0) {
    return venta.lineas
      .map((l) => ({ productoId: getRelId(l.producto), cantidad: Number(l.cantidad) || 0 }))
      .filter((l) => l.productoId && l.cantidad > 0);
  }
  const productoId = getRelId(venta.producto);
  if (productoId) return [{ productoId, cantidad: Number(venta.cantidad) || 1 }];
  return [];
}

async function ajustarStock(productoId, delta) {
  const producto = await strapi.db.query('api::product.product').findOne({ where: { id: productoId } });
  if (!producto) return;
  const nuevo = Math.max(0, Number(producto.stock ?? 0) + delta);
  await strapi.db.query('api::product.product').update({ where: { id: productoId }, data: { stock: nuevo } });
}

async function aplicarVenta(venta, signo) {
  if (!venta || !aplicaStock(venta.estado)) return;
  for (const { productoId, cantidad } of lineasDe(venta)) {
    await ajustarStock(productoId, -cantidad * signo);
  }
}

module.exports = {
  async afterCreate(event) {
    const venta = await loadFull(event.result.id);
    if (venta) await aplicarVenta(venta, +1);
  },

  async beforeUpdate(event) {
    const id = event.params?.where?.id;
    if (!id) return;
    event.state = event.state || {};
    event.state.previous = await loadFull(id);
  },

  async afterUpdate(event) {
    const previous = event.state?.previous;
    const current = await loadFull(event.result.id);
    if (previous) await aplicarVenta(previous, -1);
    if (current) await aplicarVenta(current, +1);
  },

  async beforeDelete(event) {
    const id = event.params?.where?.id;
    if (!id) return;
    const venta = await loadFull(id);
    if (venta) await aplicarVenta(venta, -1);
  },
};
