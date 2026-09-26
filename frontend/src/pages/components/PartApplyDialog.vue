<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { ElMessage } from "element-plus";
import { useSparePartUsageStore } from "../../stores/SparePartUsageStore";
import { BusinessError } from "../../constants/BusinessError";
import { createPartUsageForm } from "../../constructors/SparePartUsageConstructor";

export interface PartApplyResult {
  created: boolean;
  reqNo: string;
}

const props = defineProps<{ modelValue: boolean; ticketId: number; ticketNo: string }>();
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "applied", result: PartApplyResult): void;
}>();

const partStore = useSparePartUsageStore();
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
});

const form = reactive(createPartUsageForm(props.ticketId));
watch(visible, (open) => {
  if (open) Object.assign(form, createPartUsageForm(props.ticketId));
});

const selectedPart = computed(() => partStore.partById(form.part_id));
const stockEnough = computed(() => !selectedPart.value || form.quantity <= selectedPart.value.stock);

function submit() {
  if (form.part_id === null) {
    ElMessage.warning("请选择备件");
    return;
  }
  try {
    const usage = partStore.apply(props.ticketId, form.part_id, form.quantity);
    emit("applied", { created: true, reqNo: usage.req_no });
  } catch (error) {
    ElMessage.error(error instanceof BusinessError ? error.message : "备件申请失败");
  }
}
</script>

<template>
  <el-dialog v-model="visible" :title="`申请备件 · 工单 ${ticketNo}`" width="520px" append-to-body>
    <el-form label-width="84px">
      <el-form-item label="备件">
        <el-select v-model="form.part_id" filterable placeholder="选择备件（显示当前库存）" style="width: 100%">
          <el-option
            v-for="part in partStore.parts"
            :key="part.id"
            :label="`${part.part_name}｜${part.spec}｜库存 ${part.stock} ${part.unit}`"
            :value="part.id"
            :disabled="part.stock <= 0"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="数量">
        <el-input-number v-model="form.quantity" :min="1" :max="selectedPart?.stock ?? 1" />
        <span v-if="selectedPart" class="muted" style="margin-left: 10px">
          可用 {{ selectedPart.stock }} {{ selectedPart.unit }}（{{ selectedPart.warehouse_name }}）
        </span>
        <div v-if="!stockEnough" class="danger-text" style="font-size: 12px">申请数量超过当前库存</div>
      </el-form-item>
      <el-alert type="warning" :closable="false" title="提交后进入待审批状态，仓管审批通过才会扣减库存" />
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :disabled="!stockEnough" @click="submit">提交申请</el-button>
    </template>
  </el-dialog>
</template>
