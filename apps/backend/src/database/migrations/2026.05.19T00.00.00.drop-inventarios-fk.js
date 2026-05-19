'use strict'

module.exports = {
  async up(knex) {
    const hasTable = await knex.schema.hasTable('inventarios')
    if (!hasTable) return

    // Drop any FK constraints in ventas that reference inventarios
    const result = await knex.raw(`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      JOIN information_schema.table_constraints AS ccu
        ON ccu.constraint_name = rc.unique_constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'ventas'
        AND ccu.table_name = 'inventarios'
    `)

    for (const row of (result.rows ?? [])) {
      await knex.raw(`ALTER TABLE ventas DROP CONSTRAINT IF EXISTS "${row.constraint_name}"`)
    }
  },

  async down(knex) {},
}
