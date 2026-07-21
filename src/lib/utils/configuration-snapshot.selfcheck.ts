import assert from 'node:assert/strict';
import { energizationFormFromOrderItems } from './configuration-snapshot';

assert.equal(energizationFormFromOrderItems([]), null);
assert.equal(
  energizationFormFromOrderItems([{ configuration_snapshot: { selections: {} } }]),
  null,
);
const form = energizationFormFromOrderItems([
  {
    configuration_snapshot: {
      selections: {
        energization_form: {
          dob: '1990-01-01',
          birth_time: '06:30',
          birth_place: 'Jaipur',
          gotra: 'Kashyap',
        },
      },
    },
  },
]);
assert.equal(form?.birth_time, '06:30');
assert.equal(form?.birth_place, 'Jaipur');

console.log('configuration-snapshot.selfcheck: ok');
