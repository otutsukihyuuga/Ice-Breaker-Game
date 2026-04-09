import type { Server as IOServer } from "socket.io";

declare global {
  var __io: IOServer | undefined;
}

export function emitSessionUpdate(sessionCode: string) {
  if (!global.__io) return;
  global.__io.to(sessionCode).emit("session:update", { code: sessionCode, at: Date.now() });
}
