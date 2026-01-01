import { runSeed } from '../src/server/db/seeds';

runSeed().then(() => process.exit(0));
