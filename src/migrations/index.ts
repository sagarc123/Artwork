import * as migration_20261022_072803_initial from './20261022_072803_initial';

export const migrations = [
  {
    up: migration_20261022_072803_initial.up,
    down: migration_20261022_072803_initial.down,
    name: '20261022_072803_initial'
  },
];
