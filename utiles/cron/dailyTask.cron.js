const cron = require("node-cron");
const TaskClaim = require("../../models/UserClaimTaskTrack.model");

cron.schedule("0 * * * *", async () => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
      // Find and update all daily task claims older than 24 hours
      await TaskClaim.updateMany(
        {
          claimed: true,
          claimed_at: { $lte: twentyFourHoursAgo }
        },
        { $set: { claimed: false } }
      );
  
    } catch (err) {
      console.error("Error resetting daily task claims:", err);
    }
  });
