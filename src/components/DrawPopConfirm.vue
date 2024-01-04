<script setup lang="ts">
import { DRAW_CONFIRM } from '@/constants/index'

defineEmits(['drawConfirm', 'drawValidate'])
</script>

<template>
    <div id="drawPopConfirmLayer" class="fixed top-20 left-[calc(50%-6.125rem)] bg-white py-2 px-5 w-40 rounded-1 hidden text-center z-100">
        <template v-if="$slots.custom">
            <slot name="custom" />
        </template>
        <template v-else>
            <ElButton type="danger" @click="$emit('drawConfirm', DRAW_CONFIRM.CANCEL)">
                取消
            </ElButton>

            <ElButton type="primary" @click="$emit('drawConfirm', DRAW_CONFIRM.STAGING)">
                暂存
            </ElButton>
        </template>
    </div>
</template>
