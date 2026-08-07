import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQuantityToInventory1682754340000 implements MigrationInterface {
    name = 'AddQuantityToInventory1682754340000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory" ADD COLUMN "quantity" integer NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory" DROP COLUMN "quantity"`);
    }
}