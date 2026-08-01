/**
 * Run: npx tsx src/lib/consultation/plan-display.check.ts
 */
import { consultationModeFromPlan, stripSkype } from './plan-display';

if (stripSkype('Telephonic/Skype chat') !== 'Telephonic chat') {
  throw new Error('stripSkype should remove Skype');
}
if (consultationModeFromPlan({ title: 'Remedy (Telephonic/Skype)' }) !== 'Telephonic') {
  throw new Error('mode should be Telephonic without Skype');
}
if (consultationModeFromPlan({ title: 'Personal/Face to Face' }) !== 'Personal / Face to Face') {
  throw new Error('mode should be face to face');
}

console.log('plan-display.check: ok');
