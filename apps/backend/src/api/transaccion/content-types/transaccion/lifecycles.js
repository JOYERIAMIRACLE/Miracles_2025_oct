'use strict';

// Lifecycles de Transaccion
// Mantiene sincronizado el saldoActual de las cuentas segun tipo de transaccion:
//   - ingreso:       suma monto a cuentaDestino
//   - gasto:         resta monto de cuentaOrigen
//   - transferencia: resta de cuentaOrigen y suma a cuentaDestino

async function updateSaldo(cuentaId, delta) {
  if (!cuentaId) return;
  const cuenta = await strapi.db.query('api::cuenta.cuenta').findOne({
    where: { id: cuentaId },
  });
  if (!cuenta) return;
  const nuevoSaldo = Number(cuenta.saldoActual ?? 0) + Number(delta);
  await strapi.db.query('api::cuenta.cuenta').update({
    where: { id: cuentaId },
    data: { saldoActual: nuevoSaldo },
  });
}

async function loadFull(id) {
  if (!id) return null;
  return strapi.db.query('api::transaccion.transaccion').findOne({
    where: { id },
    populate: ['cuentaOrigen', 'cuentaDestino'],
  });
}

function getRelId(rel) {
  if (!rel) return null;
  if (typeof rel === 'number') return rel;
  if (typeof rel === 'object' && rel.id) return rel.id;
  return null;
}

async function aplicarSaldos(tx, signo) {
  if (!tx || !tx.tipo || !tx.monto) return;
  const m = Number(tx.monto) * signo;
  const origenId  = getRelId(tx.cuentaOrigen);
  const destinoId = getRelId(tx.cuentaDestino);

  if (tx.tipo === 'ingreso' && destinoId) {
    await updateSaldo(destinoId, +m);
  } else if (tx.tipo === 'gasto' && origenId) {
    await updateSaldo(origenId, -m);
  } else if (tx.tipo === 'transferencia') {
    if (origenId)  await updateSaldo(origenId,  -m);
    if (destinoId) await updateSaldo(destinoId, +m);
  }
}

module.exports = {
  async afterCreate(event) {
    // event.result no trae relaciones populated, cargamos la tx completa
    const tx = await loadFull(event.result.id);
    if (tx) await aplicarSaldos(tx, +1);
  },

  async beforeUpdate(event) {
    const id = event.params?.where?.id;
    if (!id) return;
    event.state = event.state || {};
    event.state.previous = await loadFull(id);
  },

  async afterUpdate(event) {
    const previous = event.state?.previous;
    const current  = await loadFull(event.result.id);
    // Revertir saldos anteriores y aplicar nuevos
    if (previous) await aplicarSaldos(previous, -1);
    if (current)  await aplicarSaldos(current,  +1);
  },

  async beforeDelete(event) {
    const id = event.params?.where?.id;
    if (!id) return;
    const tx = await loadFull(id);
    if (tx) await aplicarSaldos(tx, -1);
  },
};
