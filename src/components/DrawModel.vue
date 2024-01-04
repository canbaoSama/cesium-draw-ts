<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Viewer } from 'cesium'

import MouseTooltip from '@/components/MouseTooltip.vue'

import { DRAW_CONFIRM, OPERATE_STATUS } from '@/constants/index'
import { useDrawGraph } from '@/hooks/draw'
import DrawGraph from '@/components/DrawGraph.vue'
import DrawPopConfirm from '@/components/DrawPopConfirm.vue'
import DrawConfig from '@/components/DrawConfig.vue'

const props = defineProps({ viewer: Viewer, viewerContainerId: String })

const drawGraphRef = ref()
const drawConfigRef = ref()

const drawStore = useDrawGraph()
const { drawedShape, acceptProps, updateFlag, flag, modifyShape, drawingPos } = drawStore
acceptProps(props.viewer || new Viewer(props.viewerContainerId || 'viewerContainer'), props.viewerContainerId || 'viewerContainer')
function drawConfirm(type: string) {
    drawGraphRef.value?.drawConfirm(type)
}
function operateDrawGraph(type: string) {
    drawConfirm(DRAW_CONFIRM.CANCEL)
    updateFlag(type)
}
async function drawValidate(type: string) {
    try {
        await drawConfigRef.value?.validateForm()
        drawConfirm(type)
    }
    catch {
        ElMessage.warning('请检查当前绘制图形的输入参数')
    }
}

defineExpose({ drawStore })
</script>

<template>
    <div class="w-fit bg-black bg-opacity-30 z-100 h-fit p-2.5 rounded-1">
        <div class="w-full bg-black bg-opacity-60">
            <div class="w-70 relative mt-2">
                <div class="b-1-white-solid px-2 rounded-1">
                    <div class="flex justify-between py-2">
                        <ElButton size="small" class="public-cesium-btn" disabled :class="`${flag === OPERATE_STATUS.ADD ? 'active' : ''}`">
                            绘制图形
                        </ElButton>
                        <ElButton size="small" class="public-cesium-btn" :class="`${flag === OPERATE_STATUS.EDIT ? 'active' : ''}`" :disabled="!Object.keys(drawedShape).length"
                            @click="operateDrawGraph(OPERATE_STATUS.EDIT)">
                            编辑图形
                        </ElButton>
                        <ElButton size="small" class="public-cesium-btn" :class="`${flag === OPERATE_STATUS.DELETE ? 'active' : ''}`" :disabled="!Object.keys(drawedShape).length"
                            @click="operateDrawGraph(OPERATE_STATUS.DELETE)">
                            删除图形
                        </ElButton>
                    </div>
                </div>
                <div class="w-full mt-2">
                    <DrawGraph ref="drawGraphRef" />
                    <DrawConfig ref="drawConfigRef" />
                </div>
                <div v-if="[OPERATE_STATUS.ADD, OPERATE_STATUS.EDIT].includes(flag)" class="py-2 px-4 text-sm absolute public-show-box-bg rounded-1 top-31 left-[calc(-100%-48px)] color-white">
                    <header>
                        关键点
                    </header>
                    <div class="b-1-white-30-solid rounded-1 p-1 pr-0">
                        <div class="grid text-center leading-6">
                            <span>序号</span>
                            <span>经度 (°)</span>
                            <span>纬度 (°)</span>
                        </div>
                        <ElScrollbar v-if="flag === OPERATE_STATUS.EDIT" max-height="150px" class="pr-1">
                            <div v-for="(location, index) in modifyShape?.saveData.locations" :key="index" class="grid text-center leading-6">
                                <span>{{ index + 1 }}</span>
                                <span class="text-xs leading-6">{{ location[0] }}</span>
                                <span class="text-xs leading-6">{{ location[1] }}</span>
                            </div>
                        </ElScrollbar>
                        <ElScrollbar v-if="flag === OPERATE_STATUS.ADD" max-height="150px" class="pr-1">
                            <div v-for="(location, index) in drawingPos" :key="index" class="grid text-center leading-6">
                                <span>{{ index + 1 }}</span>
                                <span class="text-xs leading-6">{{ location[0] }}</span>
                                <span class="text-xs leading-6">{{ location[1] }}</span>
                            </div>
                        </ElScrollbar>
                    </div>
                </div>
            </div>
        </div>
        <DrawPopConfirm @draw-confirm="drawConfirm" @draw-validate="drawValidate" />
        <MouseTooltip />
    </div>
</template>

<style lang="less" scoped>
.public-cesium-btn {
    width: auto;
}

.grid {
    grid-template-columns: 1fr 4fr 4fr;
}
</style>
