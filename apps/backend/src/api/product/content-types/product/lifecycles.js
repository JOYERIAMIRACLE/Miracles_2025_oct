'use strict'

const slugify = (str) =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

const materialSlug = {
  'Oro 10k':   'oro-10k',
  'Plata 925': 'plata-925',
}

// Genera slug SEO: "arracada-lisa-plata-925"
function buildSlug(data) {
  const nombre   = slugify(data.nombreProducto ?? '')
  const material = materialSlug[data.materialProducto] ?? ''
  return material ? `${nombre}-${material}` : nombre
}

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params
    if (data.nombreProducto && !data.slug) {
      data.slug = buildSlug(data)
    }
  },

  async beforeUpdate(event) {
    const { data } = event.params
    // Solo regenera si cambia el nombre o material y el slug viene vacío
    if ((data.nombreProducto || data.materialProducto) && data.slug === '') {
      const existing = await strapi.entityService.findOne('api::product.product', event.params.where.id, { fields: ['nombreProducto', 'materialProducto', 'slug'] })
      data.slug = buildSlug({ ...existing, ...data })
    }
  },
}
