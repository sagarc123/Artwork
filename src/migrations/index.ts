import * as migration_20261022_072803_initial from './20261022_072803_initial';
import * as migration_20261022_090425_enquiries from './20261022_090425_enquiries';
import * as migration_20261022_093043_orders from './20261022_093043_orders';

export const migrations = [
  {
    up: migration_20261022_072803_initial.up,
    down: migration_20261022_072803_initial.down,
    name: '20261022_072803_initial',
  },
  {
    up: migration_20261022_090425_enquiries.up,
    down: migration_20261022_090425_enquiries.down,
    name: '20261022_090425_enquiries',
  },
  {
    up: migration_20261022_093043_orders.up,
    down: migration_20261022_093043_orders.down,
    name: '20261022_093043_orders'
  },
];
