const cron = require("node-cron");
const { sendConsultationReminderEmail } = require("./mailer");
const { sendPushNotification } = require("./push");

/**
 * Initialize all cron jobs
 */
const initCronJobs = () => {
  // Daily check at 13:00 (1 PM) as requested for testing
  // Change to "0 7 * * *" for 7:00 AM later
  cron.schedule("0 13 * * *", async () => {
    console.log("[CRON] Running daily price alert check...");
    try {
      // Find all active alerts and populate user to get email/fcmToken
      const activeAlerts = await PriceAlert.find({ isActive: true }).populate(
        "user",
      );

      for (const alert of activeAlerts) {
        if (!alert.user) continue;

        const filter = {
          cropType: alert.cropType,
          unit: alert.unit,
          status: "active",
        };

        if (alert.comparison === "below") {
          filter.price = { $lte: alert.targetPrice };
        } else {
          filter.price = { $gte: alert.targetPrice };
        }

        // Find if there's at least one matching crop
        // We can find the cheapest one if comparison is 'below'
        const sort =
          alert.comparison === "below" ? { price: 1 } : { price: -1 };
        const matchingCrop = await CropListing.findOne(filter).sort(sort);

        if (matchingCrop) {
          // If the alert was already triggered today, maybe skip?
          // For now, let's just trigger it once a day via this cron.
          await notifyUserOfAlert(
            alert,
            matchingCrop.price,
            alert.unit,
            matchingCrop._id,
          );
          console.log(
            `[CRON] Notified ${alert.user.name} about ${alert.cropType}`,
          );
        }
      }
    } catch (err) {
      console.error("[CRON] Error in daily price alert check:", err);
    }
  });

  console.log("[CRON] Jobs initialized (Daily check at 13:00)");

  // Every 5 minutes check for upcoming consultations
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();
      const in35Mins = new Date(now.getTime() + 35 * 60000);

      const upcomingConsultations = await Consultation.find({
        status: "confirmed",
        reminderSent: false,
        scheduledAt: { $gte: now, $lte: in35Mins },
      })
        .populate("farmer")
        .populate("expert");

      for (const consultation of upcomingConsultations) {
        const { farmer, expert, callUrl } = consultation;
        if (!farmer || !expert) continue;

        // Send Email to Farmer
        if (farmer.email) {
          await sendConsultationReminderEmail(
            farmer.email,
            farmer.name,
            expert.name,
            callUrl,
            false,
            farmer.language || "ar",
          );
        }

        // Send Email to Expert
        if (expert.email) {
          await sendConsultationReminderEmail(
            expert.email,
            expert.name,
            farmer.name,
            callUrl,
            true,
            expert.language || "ar",
          );
        }

        // Send Push Notification to Farmer
        if (farmer.fcmToken) {
          const body =
            farmer.language === "fr"
              ? `Votre consultation avec ${expert.name} commence dans moins de 30 minutes.`
              : `استشارتك مع ${expert.name} ستبدأ خلال أقل من 30 دقيقة.`;
          await sendPushNotification(
            farmer.fcmToken,
            "تذكير بموعد الاستشارة ⏳",
            body,
            { type: "consultation", id: consultation._id, callUrl },
          );
        }

        // Send Push Notification to Expert (if they use the app, though usually web)
        if (expert.fcmToken) {
          const body =
            expert.language === "fr"
              ? `Vous avez une consultation avec ${farmer.name} qui commence dans moins de 30 minutes.`
              : `لديك استشارة مجدولة مع ${farmer.name} ستبدأ خلال أقل من 30 دقيقة.`;
          await sendPushNotification(
            expert.fcmToken,
            "تذكير بموعد الاستشارة ⏳",
            body,
            { type: "consultation", id: consultation._id, callUrl },
          );
        }

        consultation.reminderSent = true;
        await consultation.save();
        console.log(
          `[CRON] Sent 30-min reminder for consultation ${consultation._id}`,
        );
      }
    } catch (err) {
      console.error("[CRON] Error in consultation reminder check:", err);
    }
  });
};

module.exports = { initCronJobs };
