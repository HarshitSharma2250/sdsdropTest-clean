const cron = require("node-cron");
const RewardCycleTracker = require("../../models/RewardCycleTracker");
const ApiHit = require("../../models/Hunting.model");
const Reward = require("../../models/UserReward");

cron.schedule("0 * * * *", async () => {
  const activeTrackers = await RewardCycleTracker.find({ active: true }).populate("apiHitId");

  for (const tracker of activeTrackers) {
    const apiHit = tracker.apiHitId;

    if (!apiHit || !apiHit.createdAt) continue;

    const now = new Date();
    const hitTime = new Date(apiHit.createdAt);
    const hoursPassed = Math.floor((now - hitTime) / (1000 * 60 * 60));

    // Stop if time or limit passed
    if (hoursPassed >= 3 || tracker.hoursRewarded >= 3) {
      tracker.active = false;
      await tracker.save();
      continue;
    }

    // Add reward
    const multiPoints = apiHit.multiPoints;
    const userId = apiHit.user_id;

    await Reward.updateOne(
      { userId },
      { $inc: { tsads: multiPoints * 1000 } }
    );

    tracker.hoursRewarded += 1;
    await tracker.save();

    console.log(`Rewarded user ${userId} for hour ${tracker.hoursRewarded}`);
  }
});
