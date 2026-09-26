import { computed, ref, type MaybeRefOrGetter, toValue } from "vue";

/** 通用分页 hook：态势/资产/报修/工单/备件列表共用 */
export function usePagination<T>(rows: MaybeRefOrGetter<T[]>, pageSize = 8) {
  const page = ref(1);
  const total = computed(() => toValue(rows).length);
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));
  const pageRows = computed(() => {
    const start = (page.value - 1) * pageSize;
    return toValue(rows).slice(start, start + pageSize);
  });
  const go = (p: number) => {
    page.value = Math.min(Math.max(1, p), pageCount.value);
  };
  return { page, pageSize, pageRows, total, pageCount, go };
}
