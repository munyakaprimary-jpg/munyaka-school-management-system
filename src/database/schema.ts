export const up = async (knex: Knex) => {
  await knex.schema.createTable('Marks', (table) => {
    table.string('learner_id').notNullable();
    table.string('class_grade').notNullable();
    table.string('academic_year').notNullable();
    table.string('term').notNullable();
    table.string('exam_type').notNullable();
    table.jsonb('marks');
    table.timestamps(true, true);
  });
};

export const down = async (knex: Knex) => {
  await knex.schema.dropTableIfExists('Marks');
};