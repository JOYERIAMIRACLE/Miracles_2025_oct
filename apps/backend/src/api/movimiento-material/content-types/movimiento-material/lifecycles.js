'use strict';

// Lifecycles de Movimiento de Material
// Mantiene sincronizado el stockGramos del material segun tipo de movimiento:
//   - entrada: suma gramos (compra recibida)
//   - salida:  resta gramos (se consumieron al dar de alta/reponer una pieza)

async function updateStock(materialId, delta) {
  if (!materialId) return;
  const material = await strapi.db.query('api::material.material').findOne({
    where: { id: materialId },
  });
  if (!material) return;
  const nuevoStock = Number(material.stockGramos ?? 0) + Number(delta);
  await strapi.db.query('api::material.material').update({
    where: { id: materialId },
    data: { stockGramos: nuevoStock },
  });
}

async function loadFull(id) {
  if (!id) return null;
  return strapi.db.query('api::movimiento-material.movimiento-material').findOne({
    where: { id },
    populate: ['material'],
  });
}

function getRelId(rel) {
  if (!rel) return null;
  if (typeof rel === 'number') return rel;
  if (typeof rel === 'object' && rel.id) return rel.id;
  return null;
}

async function aplicarStock(mov, signo) {
  if (!mov || !mov.tipo || !mov.gramos) return;
  const g = Number(mov.gramos) * signo;
  const materialId = getRelId(mov.material);
  if (!materialId) return;
  if (mov.tipo === 'entrada') await updateStock(materialId, +g);
  else if (mov.tipo === 'salida') await updateStock(materialId, -g);
}

module.exports = {
  async afterCreate(event) {
    const mov = await loadFull(event.result.id);
    if (mov) await aplicarStock(mov, +1);
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
    if (previous) await aplicarStock(previous, -1);
    if (current)  await aplicarStock(current,  +1);
  },

  async beforeDelete(event) {
    const id = event.params?.where?.id;
    if (!id) return;
    const mov = await loadFull(id);
    if (mov) await aplicarStock(mov, -1);
  },
};
