'use strict'

module.exports = {
  async up(knex) {
    // Drop inventario_id column from ventas (old FK to inventarios table)
    const hasColumn = await knex.schema.hasColumn('ventas', 'inventario_id')
    if (hasColumn) {
      await knex.schema.alterTable('ventas', t => {
        t.dropColumn('inventario_id')
      })
    }

    // Drop inventarios table if it still exists
    const hasTable = await knex.schema.hasTable('inventarios')
    if (hasTable) {
      await knex.schema.dropTableIfExists('inventarios')
    }
  },

  async down(knex) {},
}
