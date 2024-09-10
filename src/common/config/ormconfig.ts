import 'dotenv/config'
import { DataSource } from "typeorm";


const config = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [`${__dirname}/../../**/*.entity*{.ts,.js}`],
  migrations: [`${__dirname}/../../migrations/*{.ts,.js}`],
  migrationsTableName: 'migrations',
  logging: true,
  synchronize: false,
});

export default config;
