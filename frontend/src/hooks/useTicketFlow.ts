import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { TicketStatusFlow, TicketStatusText } from "../constants/TicketStatus";
import type { RepairTicket } from "../types/RepairTicket";
import type { TicketStatus } from "../types/TicketStatus";

/**
 * 工单流转 hook：封装状态机推进规则与按钮文案。
 * 班组长页面与工单详情共用，状态枚举改动只需改 TicketStatus 常量。
 */
export function useTicketFlow(ticketSource: MaybeRefOrGetter<RepairTicket | undefined>) {
  const currentIndex = computed(() => {
    const ticket = toValue(ticketSource);
    return ticket ? TicketStatusFlow.indexOf(ticket.status) : -1;
  });

  const nextStatus = computed<TicketStatus | null>(() => {
    const idx = currentIndex.value;
    return idx >= 0 && idx < TicketStatusFlow.length - 1 ? TicketStatusFlow[idx + 1] : null;
  });

  const nextActionText = computed(() => {
    switch (nextStatus.value) {
      case "ASSIGNED":
        return "派工";
      case "ARRIVED":
        return "确认到场";
      case "REPAIRING":
        return "开始处理";
      case "RESTORED":
        return "复电确认";
      case "CLOSED":
        return "归档";
      default:
        return "";
    }
  });

  /** 时间线：每个状态节点是否到达 + 时间字段 */
  const timeline = computed(() =>
    TicketStatusFlow.map((status, index) => {
      const ticket = toValue(ticketSource);
      const reached = !!ticket && index <= currentIndex.value;
      const timeField = ["created_at", "assigned_at", "arrived_at", "repairing_at", "restored_at", "closed_at"][index] as keyof RepairTicket;
      return {
        status,
        label: TicketStatusText[status],
        reached,
        active: ticket?.status === status,
        time: ticket && reached ? (ticket[timeField] as string | null) : null
      };
    })
  );

  return { currentIndex, nextStatus, nextActionText, timeline };
}
