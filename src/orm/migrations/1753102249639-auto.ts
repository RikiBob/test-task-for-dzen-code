import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1753102249639 implements MigrationInterface {
    name = 'Auto1753102249639'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "file" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "original_name" character varying NOT NULL, "type" character varying NOT NULL, "size" integer NOT NULL, "key" character varying NOT NULL, "url" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d85c96c207a7395158a68ee1265" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE TABLE "comment" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "home_page" character varying, "text" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_uuid" uuid, "parent_comment" uuid, "file_uuid" uuid, CONSTRAINT "REL_300f1559fe5f50c57d5bb0328c" UNIQUE ("file_uuid"), CONSTRAINT "PK_e45a9d11ff7a3cf11f6c42107b4" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE TABLE "user" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "picture" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "update_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a95e949168be7b7ece1a2382fed" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`ALTER TABLE "comment" ADD CONSTRAINT "FK_1964d8d5a07d1c223ad626b276c" FOREIGN KEY ("parent_comment") REFERENCES "comment"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment" ADD CONSTRAINT "FK_27ce1f8f32138a1a68bd92cff7d" FOREIGN KEY ("user_uuid") REFERENCES "user"("uuid") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment" ADD CONSTRAINT "FK_300f1559fe5f50c57d5bb0328cd" FOREIGN KEY ("file_uuid") REFERENCES "file"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comment" DROP CONSTRAINT "FK_300f1559fe5f50c57d5bb0328cd"`);
        await queryRunner.query(`ALTER TABLE "comment" DROP CONSTRAINT "FK_27ce1f8f32138a1a68bd92cff7d"`);
        await queryRunner.query(`ALTER TABLE "comment" DROP CONSTRAINT "FK_1964d8d5a07d1c223ad626b276c"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "comment"`);
        await queryRunner.query(`DROP TABLE "file"`);
    }

}
