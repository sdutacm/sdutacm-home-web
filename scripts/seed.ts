import 'reflect-metadata';

const path = require('path');
const moduleAlias = require('module-alias');

moduleAlias.addAlias('@server', path.join(__dirname, '../src/server'));
moduleAlias.addAlias('@common', path.join(__dirname, '../src/common'));

import { runSeed } from '../src/server/db/seeds';

runSeed().then(() => process.exit(0)).catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
