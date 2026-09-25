import type { Server } from "stoat.js";

// servers above this size are too large to fetch all members for
const LARGE_SERVER_MEMBER_THRESHOLD = 1000;

export function isLargeServer(server?: Server) {
  return (server?.approximateMemberCount ?? 0) > LARGE_SERVER_MEMBER_THRESHOLD;
}
