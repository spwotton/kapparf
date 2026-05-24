import { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    authenticated?: boolean;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.authenticated === true) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized", loginRequired: true });
}
