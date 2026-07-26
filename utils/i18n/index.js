import ar from "./ar.js";
import fr from "./fr.js";

const messages = { ar, fr };

/**
 * Get translated message
 * @param {string} key   - e.g. "LOGIN_SUCCESS"
 * @param {string} lang  - "ar" | "fr" (default: "ar")
 */
export const t = (key, lang = "ar") => {
  const dict = messages[lang] || messages["ar"];
  return dict[key] || ar[key] || key;
};

export const getLang = (req) => {
  const lang =
    req.query?.lang ||
    req.body?.lang ||
    req.headers["accept-language"]
      ?.split(",")[0]
      ?.split("-")[0]
      ?.toLowerCase();

  return ["ar", "fr"].includes(lang) ? lang : "ar";
};
