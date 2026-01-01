import { DataSource } from 'typeorm';

const appDataSource = new DataSource({
  type: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  username: 'wjh',
  password: '123456',
  database: 'sdutacm-home-web-test',
  logging: true,
  synchronize: false,
  entities: [__dirname + '/entity/*.ts'],
});

export default appDataSource;
