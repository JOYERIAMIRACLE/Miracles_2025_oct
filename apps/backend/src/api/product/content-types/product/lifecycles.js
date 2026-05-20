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

function buildSlug(data) {
  const nombre   = slugify(data.nombreProducto ?? '')
  const material = materialSlug[data.materialProducto] ?? ''
  return material ? `${nombre}-${material}` : nombre
}

module.exports = {
  beforeCreate(event) {
    const { data } = event.params
    if (data.nombreProducto && !data.slug) {
      data.slug = buildSlug(data)
    }
  },
}
