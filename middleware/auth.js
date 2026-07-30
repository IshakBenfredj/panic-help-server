import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { t, getLang } from "../utils/i18n/index.js";

const protect = async (req, res, next) => {
  const lang = getLang(req);
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      message: t("TOKEN_MISSING", lang),
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: t("USER_NOT_FOUND", lang) });
    }

    req.user = user;
    req.lang = lang;
    if (user.role === "patient") {
      const now = new Date();
      if (
        !user.subscription ||
        !user.subscription.expiresAt ||
        now > user.subscription.expiresAt
      ) {
        return res
          .status(403)
          .json({ needSubscription: true, message: "Subscription required" });
      }
    }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        message: t("TOKEN_EXPIRED", lang),
      });
    }
    return res.status(401).json({
      message: t("TOKEN_INVALID", lang),
    });
  }
};

/**
 * Restrict to admin only
 */
const adminOnly = (req, res, next) => {
  const lang = req.lang || "ar";
  if (req.user?.role === "admin") return next();
  return res.status(401).json({
    message: t("ADMIN_ONLY", lang),
  });
};

const authorize = (...roles) => {
  return (req, res, next) => {
    const lang = req.lang || "ar";
    if (!roles.includes(req.user?.role)) {
      return res.status(401).json({
        message: t("FORBIDDEN", lang),
      });
    }
    next();
  };
};

/**
 * Same as protect but skips the subscription check.
 * Use on routes that unsubscribed patients must still reach (e.g. /subscription/checkout).
 */
const protectNoSubscription = async (req, res, next) => {
  const lang = getLang(req);
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: t("TOKEN_MISSING", lang) });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: t("USER_NOT_FOUND", lang) });
    }
    req.user = user;
    req.lang = lang;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: t("TOKEN_EXPIRED", lang) });
    }
    return res.status(401).json({ message: t("TOKEN_INVALID", lang) });
  }
};

export { protect, protectNoSubscription, adminOnly, authorize };
