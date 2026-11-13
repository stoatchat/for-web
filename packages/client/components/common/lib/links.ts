/**
 * Google Play listing for the Stoat app
 */
export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=chat.revolt";

/** Any valid path within app scope that can be shared as a link */
export const RE_APP_PUB_PATH =
  /^(?:\/i\/[\w:.]{1,32})?\/(?:(?:server\/[ABCDEFGHJKMNPQRSTVWXYZ\d]{26}\/)?channel\/[ABCDEFGHJKMNPQRSTVWXYZ\d]{26}(?:\/[ABCDEFGHJKMNPQRSTVWXYZ\d]{26})?|bot\/[ABCDEFGHJKMNPQRSTVWXYZ\d]{26}|invite\/\w+)\/?$/;

/** Any valid internal app path */
export const RE_APP_PRIV_PATH =
  /^(?:\/i\/[\w:.]{1,32})?\/(?:app|pwa|friends|login(?:\/.+)?|discover(?:\/.+)?)\/?$/;
