import { DataSource } from 'typeorm';

const isProd = process.env.NODE_ENV === 'production';

const appDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  logging: false,
  synchronize: true,
  entities: [__dirname + '/entity/*.{ts,js}'],
});

export default appDataSource;
