import signale from "signale";

export const signaleLogger = new signale.Signale({
  logLevel: process.env.LOG_LEVEL || "info",
});
