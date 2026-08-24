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
//
// También crea automáticamente una Transaccion de ingreso (Finanzas) la
// primera vez que el pedido llega a "Pagado" — antes esto solo pasaba si
// alguien lo re-capturaba a mano en "Registrar pago" (CRM), lo cual dejaba
// a Ventas y Finanzas como silos desconectados y con riesgo de contar el
// mismo ingreso dos veces. Se guarda en venta.transaccionGenerada para que
// nunca se cree una segunda transacción para el mismo pedido, sin importar
// cuántas veces se actualice después de llegar a "Pagado".

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
    populate: { lineas: { populate: ['producto'] }, producto: true, cliente: true, transaccionGenerada: true },
  });
}

async function crearTransaccionDeVenta(venta) {
  const clienteId = getRelId(venta.cliente);
  const clienteNombre = venta.cliente && typeof venta.cliente === 'object' ? venta.cliente.nombre : null;

  return strapi.db.query('api::transaccion.transaccion').create({
    data: {
      descripcion: venta.concepto || `Pedido ${venta.id}`,
      tipo: 'ingreso',
      monto: venta.monto,
      fecha: venta.fecha,
      metodoPago: venta.metodoPago || null,
      referencia: clienteNombre,
      ambito: 'empresa',
      cliente: clienteId || undefined,
      publishedAt: new Date(),
    },
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
    // Caso raro: creado directo en "Pagado" (el flujo normal siempre nace
    // "Cotizado", ver nota arriba). Aquí sí hace falta un segundo write —
    // el update subsiguiente vuelve a disparar este mismo lifecycle, pero
    // el guard de "ya tiene transaccionGenerada" en beforeUpdate corta la
    // recursión en la segunda vuelta sin crear una transacción de más.
    if (venta && venta.estado === 'Pagado' && !venta.transaccionGenerada) {
      const transaccion = await crearTransaccionDeVenta(venta);
      await strapi.db.query('api::venta.venta').update({
        where: { id: venta.id },
        data: { transaccionGenerada: transaccion.id },
      });
    }
  },

  async beforeUpdate(event) {
    const id = event.params?.where?.id;
    if (!id) return;
    event.state = event.state || {};
    const previous = await loadFull(id);
    event.state.previous = previous;

    // Se inyecta transaccionGenerada en el MISMO write que ya está en curso
    // (en vez de hacer un update aparte después) para no volver a disparar
    // este lifecycle de forma recursiva.
    const patch = event.params.data || {};
    const estadoFinal = Object.prototype.hasOwnProperty.call(patch, 'estado') ? patch.estado : previous?.estado;
    const yaEraPagado = previous?.estado === 'Pagado';
    const yaTieneTransaccion = !!previous?.transaccionGenerada;
    if (estadoFinal === 'Pagado' && !yaEraPagado && !yaTieneTransaccion) {
      const transaccion = await crearTransaccionDeVenta({ ...previous, ...patch });
      patch.transaccionGenerada = transaccion.id;
      event.params.data = patch;
    }
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
