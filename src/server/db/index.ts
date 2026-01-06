import { DataSource } from 'typeorm';

const isProd = process.env.NODE_ENV === 'production';

const appDataSource = new DataSource({
  type: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  username: 'wjh',
  password: '123456',
  database: 'sdutacm-home-web-test',
  logging: false,
  synchronize: !isProd,
  entities: [__dirname + '/entity/*.{ts,js}'],
});

export default appDataSource;
