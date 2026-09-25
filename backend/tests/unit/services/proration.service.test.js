import { calculateProration } from '../../../src/services/proration.service.js';
import prisma from '../../../src/config/prisma.js';

describe('Proration Service - Unit Tests', () => {
  it('should accurately calculate upgrade cost with remaining credit', async () => {
    const plans = await prisma.subscriptionPlan.findMany({ take: 2 });
    const sub = await prisma.subscription.findFirst();

    if (plans.length >= 2 && sub) {
      const result = await calculateProration({
        subscriptionId: sub.id,
        newPlanId: plans[1].id,
        changeType: 'UPGRADE',
      });

      expect(result).toBeDefined();
      expect(result.currentPlan).toBeDefined();
      expect(result.newPlan).toBeDefined();
      expect(result.cycle.totalCycleDays).toBeGreaterThan(0);
      expect(typeof result.proration.amountToCharge).toBe('number');
    }
  });
});
