<script setup lang="ts">
import { LINE_TYPE_MAP } from '@/constants/index'
</script>

<template>
    <ElSelect size="small" placeholder="请选择线型">
        <ElOption v-for="(line) in LINE_TYPE_MAP" :key="line.key" :label="line.value" :value="line.key">
            <div v-if="line.key === LINE_TYPE_MAP.LINE_NORMAL.key" class="bg-black w-[calc(100%+10px)] h-0.25 mt-4" />
            <div v-if="line.key === LINE_TYPE_MAP.LINE_ARROW.key" class="bg-black w-full mt-4 public-arrow-line" />
            <div v-if="line.key === LINE_TYPE_MAP.LINE_DASHED.key" class="w-[calc(100%+10px)] h-0 border-dashed b-0 b-t-1 mt-4" />
            <div v-if="line.key === LINE_TYPE_MAP.LINE_GLOW.key" class="bg-black w-[calc(100%+10px)] h-0.25 mt-4 shadow-water-4" />
        </ElOption>
    </ElSelect>
</template>

<style lang="less" scoped>
.public-arrow-line {
    height: 1px;
    background: black;
    position: relative;

    &::before {
        content: '';
        position: absolute;
        top: -8px;
        right: -10px;
        width: 0;
        height: 0;
        border-top: 8px solid transparent;
        border-bottom: 8px solid transparent;
        border-left: 10px solid black;
    }
}
</style>
