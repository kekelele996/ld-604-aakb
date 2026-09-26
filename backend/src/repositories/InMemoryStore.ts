import type { Snapshot } from "../models/Audit";
import { buildSeed } from "../seed";

/**
 * 内存数据仓储：演示环境下替代 MySQL/Prisma 的唯一可变数据源。
 * 所有 service 在克隆快照上执行业务规则后整体替换，
 * 保证“复电同时更新故障和资产状态”的跨实体一致性。
 * 生产实现可将本类替换为 Prisma 事务，接口保持不变。
 */
class InMemoryStore {
  private snapshot: Snapshot;

  constructor() {
    this.snapshot = this.fromSeed();
  }

  private fromSeed(): Snapshot {
    const seed = buildSeed();
    return {
      gridAssets: structuredClone(seed.gridAssets),
      faults: structuredClone(seed.faults),
      tickets: structuredClone(seed.tickets),
      crews: structuredClone(seed.crews),
      parts: structuredClone(seed.parts),
      stocks: structuredClone(seed.stocks),
      stockTxns: structuredClone(seed.stockTxns),
      auditLogs: structuredClone(seed.auditLogs),
      serverTime: new Date().toISOString()
    };
  }

  getSnapshot(): Snapshot {
    return this.snapshot;
  }

  setSnapshot(next: Snapshot): void {
    next.serverTime = new Date().toISOString();
    this.snapshot = next;
  }

  reset(): Snapshot {
    this.snapshot = this.fromSeed();
    return this.snapshot;
  }
}

export const dataStore = new InMemoryStore();
