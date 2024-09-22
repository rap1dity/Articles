import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTokens1726425455443 implements MigrationInterface {
    name = 'CreateTokens1726425455443'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tokens" ("jti" character varying NOT NULL, "deviceId" character varying NOT NULL, "revoked" boolean NOT NULL DEFAULT false, "expiresAt" TIMESTAMP NOT NULL, "userId" integer, CONSTRAINT "PK_14be932c0a5c04a72a561dd8bf2" PRIMARY KEY ("jti", "deviceId"))`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD CONSTRAINT "FK_d417e5d35f2434afc4bd48cb4d2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "FK_d417e5d35f2434afc4bd48cb4d2"`);
        await queryRunner.query(`DROP TABLE "tokens"`);
    }

}
