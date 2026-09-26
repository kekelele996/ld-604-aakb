import { computed, ref, watch, type MaybeRefOrGetter, toValue } from "vue";

/** 通用分页 hook：资产、报修、工单、备件、审计日志列表共用 */
export function usePagination<T>(rowsSource: MaybeRefOrGetter<T[]>, pageSize = 8) {
  const page = ref(1);
  const rows = computed(() => toValue(rowsSource));
  const totalPages = computed(() => Math.max(1, Math.ceil(rows.value.length / pageSize)));
  const pageRows = computed(() => rows.value.slice((page.value - 1) * pageSize, page.value * pageSize));

  // 筛选后数据变少，回收越界页码
  watch(totalPages, (max) => {
    if (page.value > max) page.value = max;
  });

  const go = (target: number) => {
    page.value = Math.min(Math.max(1, target), totalPages.value);
  };

  return { page, pageSize, pageRows, total: computed(() => rows.value.length), totalPages, go };
}
