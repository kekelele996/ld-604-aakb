import { ElMessage } from "element-plus";
import type { Snapshot } from "../types/Snapshot";
import { useDataStore } from "../stores/dataStore";
import { useAuthStore } from "../stores/authStore";

/**
 * 所有写操作的统一入口：store action 调用 api →
 * 成功：整快照替换（跨实体联动）+ 成功提示；失败：错误码/消息分层包装后提示。
 */
export const runAction = async (
  fn: (actor: ReturnType<typeof useAuthStore>["user"]) => Promise<Snapshot>,
  successText: string
): Promise<boolean> => {
  const data = useDataStore();
  const auth = useAuthStore();
  try {
    const next = await fn(auth.user);
    data.apply(next);
    ElMessage.success(successText);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : "操作失败，请重试";
    ElMessage.error(message);
    data.lastError = message;
    return false;
  }
};
