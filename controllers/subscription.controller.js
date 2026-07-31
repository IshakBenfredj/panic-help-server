import User from "../models/User.js";
import Payment from "../models/Payment.js";
import VideoSession from "../models/VideoSession.js";
import { verifySignature } from "@chargily/chargily-pay";

export const handleSubscriptionWebhook = async (req, res) => {
  try {
    const signature = req.get("signature");

    if (!signature) {
      console.error("❌ Missing Chargily signature header");
      return res.sendStatus(400);
    }

    const rawBody = req.rawBody;
    const secretKey = process.env.CHARGILY_SECRET_KEY;

    const isValid = verifySignature(rawBody, signature, secretKey);
    if (!isValid) {
      console.error("❌ Invalid Chargily webhook signature");
      return res
        .status(403)
        .json({ success: false, message: "Invalid signature" });
    }

    const event = req.body;
    console.log("✅ Verified Chargily webhook event:", event.type);

    if (event.type !== "checkout.paid") {
      return res.status(200).json({ success: true, message: "Event ignored" });
    }

    const { type, user_id, plan, sessionId } = event.data.metadata || {};
    
    if (type === "video_session") {
      if (!sessionId) {
        return res
          .status(400)
          .json({ success: false, message: "Missing sessionId in metadata" });
      }

      const session = await VideoSession.findById(sessionId);
      if (!session) {
        return res
          .status(404)
          .json({ success: false, message: "Session not found" });
      }

      session.status = "accepted";
      await session.save();

      const paymentAmount = event.data.amount || session.price || 0;
      const payment = new Payment({
        user: user_id,
        amount: paymentAmount,
        currency: "dzd",
        type: "video_session",
        status: "completed",
        paymentMethod: "chargily",
        description: `دفع جلسة فيديو - ${event.data.id}`,
        metadata: {
          checkout_id: event.data.id,
          session_id: sessionId,
          amount: paymentAmount,
        },
      });
      await payment.save();

      console.log(`✅ Video Session paid and accepted: ${sessionId}`);
      return res
        .status(200)
        .json({ success: true, message: "Video session updated" });
    }

    // Default to subscription logic
    if (plan !== "monthly_500" && plan !== "monthly_3500") {
      return res
        .status(200)
        .json({ success: true, message: "Not a recognized event" });
    }

    if (!user_id) {
      return res
        .status(400)
        .json({ success: false, message: "Missing user_id" });
    }

    const user = await User.findById(user_id);
    if (!user) {
      console.error("User not found for subscription webhook", user_id);
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(now.getMonth() + 1);

    user.subscription = {
      plan: "monthly_500",
      expiresAt: nextMonth,
      sessionsRemaining: 3,
    };
    await user.save();

    const paymentAmount = event.data.amount ?? 500;
    const payment = new Payment({
      user: user_id,
      amount: paymentAmount,
      currency: "dzd",
      type: "subscription",
      status: "completed",
      paymentMethod: "chargily",
      description: `اشتراك شهري 500 دج - ${event.data.id}`,
      metadata: {
        checkout_id: event.data.id,
        plan,
        amount: paymentAmount,
      },
    });
    await payment.save();

    console.log(`✅ Subscription activated for user ${user_id}`);
    return res
      .status(200)
      .json({ success: true, message: "Subscription updated" });
  } catch (error) {
    console.error("❌ Subscription webhook error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
