import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import type { Role } from "../types";

const ACCOUNTS: Record<string, { password: string; role: Role; id: number; name: string }> = {
  dispatcher: { password: "123456", role: "DISPATCHER", id: 1, name: "调度员-林调度" },
  leader: { password: "123456", role: "LEADER", id: 101, name: "张建国（班组长）" },
  warehouse: { password: "123456", role: "WAREHOUSE", id: 201, name: "仓管员-周敏" },
  auditor: { password: "123456", role: "AUDITOR", id: 301, name: "审计员-郑审计" }
};

export const authController = {
  login(req: Request, res: Response) {
    const { username, password } = req.body as { username?: string; password?: string };
    const account = username ? ACCOUNTS[username] : undefined;
    if (!account || account.password !== password) {
      return res.status(401).json({ code: "AUTH_REQUIRED", message: "用户名或密码错误（dispatcher/leader/warehouse/auditor，密码 123456）" });
    }
    const token = jwt.sign({ sub: account.id, name: account.name, role: account.role }, config.jwtSecret, { expiresIn: "8h" });
    res.json({ token, role: account.role, name: account.name });
  }
};
