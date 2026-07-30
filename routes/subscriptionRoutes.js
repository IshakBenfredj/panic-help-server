// server/routes/subscriptionRoutes.js
import express from "express";
import { handleSubscriptionWebhook } from "../controllers/subscription.controller.js";

const router = express.Router();
router.post("/webhook", handleSubscriptionWebhook);

export default router;
