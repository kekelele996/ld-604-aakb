import { computed, type MaybeRefOrGetter, toValue } from "vue";
import type { RepairTicket } from "../types/RepairTicket";
import type { FaultReport } from "../types/FaultReport";
import { TicketStatus, TicketStatusFlow, TicketStatusText, type TicketStatus as TStatus } from "../constants/TicketStatus";
import type { Snapshot } from "../types/Snapshot";

export interface TimelineStep {
  key: TStatus;
  label: string;
  time: string | null;
  done: boolean;
  current: boolean;
}

type TicketGetter = MaybeRefOrGetter<RepairTicket | undefined>;

/**
 * 工单流转 hook：
 * 计算当前状态在 TicketStatusFlow 中的位置、可执行的下一步、时间线节点，
 * TicketsPage 与报修轨迹抽屉共用。
 */
export function useTicketFlow(ticket: TicketGetter) {
  const current = computed(() => toValue(ticket));
  const currentIndex = computed(() =>
    current.value ? TicketStatusFlow.indexOf(current.value.status) : -1
  );

  const nextStatus = computed<TStatus | null>(() =>
    currentIndex.value >= 0 && currentIndex.value < TicketStatusFlow.length - 1
      ? TicketStatusFlow[currentIndex.value + 1]
      : null
  );

  const canAdvance = computed(() =>
    current.value
      ? (["ASSIGNED", "ARRIVED", "REPAIRING", "RESTORED"] as string[]).includes(current.value.status)
      : false
  );

  const timeline = computed<TimelineStep[]>(() => {
    const t = current.value;
    if (!t) return [];
    const stamps: Record<TStatus, string | null> = {
      WAIT_DISPATCH: t.created_at,
      ASSIGNED: t.assigned_at,
      ARRIVED: t.arrived_at,
      REPAIRING: t.repairing_at,
      RESTORED: t.restored_at,
      CLOSED: t.closed_at
    };
    const idx = TicketStatusFlow.indexOf(t.status);
    return TicketStatusFlow.map((key, i) => ({
      key,
      label: TicketStatusText[key],
      time: stamps[key],
      done: i <= idx,
      current: i === idx
    }));
  });

  return { current, currentIndex, nextStatus, canAdvance, timeline };
}

/** 带快照的版本：额外派生工单关联的全部报修单（含同线路合并单） */
export function useTicketFlowWithSnapshot(ticket: TicketGetter, snapshot: MaybeRefOrGetter<Snapshot>) {
  const base = useTicketFlow(ticket);
  const relatedFaults = computed<FaultReport[]>(() => {
    const t = base.current.value;
    const snap = toValue(snapshot);
    if (!t) return [];
    return t.merged_report_ids
      .map((id) => snap.faults.find((f) => f.id === id))
      .filter((f): f is FaultReport => Boolean(f));
  });
  return { ...base, relatedFaults };
}
