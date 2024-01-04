<script setup lang="ts">
import { inject, onUnmounted, watch } from 'vue'
import { ScreenSpaceEventHandler, ScreenSpaceEventType, defined } from 'cesium'
import { ElMessage } from 'element-plus'
import { cloneDeep, debounce } from 'lodash-es'

import { requireImage } from '@/utils/common'
import type { DrawEntity } from '@/types/index'

import { isEmpty } from '@/utils/index'
import { DRAW_CONFIRM, DRAW_GRAPH_MAP, OPERATE_STATUS } from '@/constants/index'

import { drawConfig } from '@/utils/cesium/drawGraph/config'

const { updateFlag, drawingType, DrawGraphType, drawGraph, flag, viewer, drawedShape, modifyShape, attrForm } = inject('drawStore')

let handler: ScreenSpaceEventHandler | undefined

// 进入或者切换绘制状态,开始绘制
function enterDrawStatus(type: string, flagType?: string) {
    exitOperateStatus()
    if (flagType) {
        updateFlag(flagType)
        cancelDrawGraph()
    }
    if (type === drawingType.value)
        return
    drawingType.value = type
    DrawGraphType(type)
    if (type)
        drawGraph.value?.startDraw()
}

// 选择图形移除
function removeDrawGraph() {
    ElMessage({ message: '点击图形进行删除!', duration: 1000, type: 'warning', offset: (window.innerHeight - 48) / 2 })
    enterDrawStatus('')
    bindGloveEvent()
}
// 选择图形进入编辑状态
function editDrawGraph() {
    ElMessage({ message: '点击图形进行编辑!', duration: 1000, type: 'warning', offset: (window.innerHeight - 48) / 2 })
    enterDrawStatus('')
    bindGloveEvent()
}
// 给绘制的图形绑定点击事件
function bindGloveEvent() {
    handler = new ScreenSpaceEventHandler(viewer.value?.scene.canvas)
    handler.setInputAction((movement: any) => {
        const pick = viewer.value?.scene.pick(movement.position)
        if (defined(pick)) {
            const obj = pick?.id
            if (!obj || !obj.layerId || flag.value === OPERATE_STATUS.NONE)
                return
            if (flag.value === OPERATE_STATUS.EDIT)
                enterDrawEditing(obj.timeStampId, obj.drawType)
            else if (flag.value === OPERATE_STATUS.DELETE)
                clearEntityById(obj.timeStampId, true)
        }
    }, ScreenSpaceEventType.LEFT_CLICK)
}
function clearEntityById(timeStampId: number, clearDrawedShape = false) {
    const entityList = viewer.value?.entities.values
    if (!entityList || entityList.length < 1)
        return

    for (let i = 0; i < entityList.length; i++) {
        const entity: DrawEntity = entityList[i]
        if (entity.layerId === drawConfig.layerId && entity.timeStampId === timeStampId) {
            viewer.value?.entities.remove(entity)
            i--
        }
    }
    if (clearDrawedShape)
        delete drawedShape.value[timeStampId]

    if (isEmpty(drawedShape))
        updateFlag(OPERATE_STATUS.NONE)
}
function enterDrawEditing(timeStampId: number, drawType: string) {
    // 先移除entity
    clearEntityById(timeStampId)
    enterDrawStatus(drawType)
    drawGraph.value?.reEnterModify(drawedShape.value[timeStampId])
    modifyShape.value = drawedShape.value[timeStampId]
    if (modifyShape.value?.config)
        attrForm.value = cloneDeep(modifyShape.value.config)
}
// 保存绘制,将锚点和监听清除
function saveDrawGraph() {
    const stagingData = drawGraph.value.saveDraw()
    if (stagingData)
        drawedShape.value[drawGraph.value?.timeStampId] = stagingData
    enterDrawStatus('')
}

// 取消绘制,则移除当前正在绘制的数据
function cancelDrawGraph() {
    drawGraph.value?.clearDrawing()
    if (drawedShape.value[drawGraph.value?.timeStampId]) // 初始绘制时未保存该绘制数据的时候，这个图形是直接删除的
        drawGraph.value?.drawOldData(drawedShape.value[drawGraph.value?.timeStampId])

    modifyShape.value = undefined
    enterDrawStatus('')
}
// 退出当前操作状态
function exitOperateStatus() {
    if (handler) {
        handler.destroy()
        handler = undefined
    }
}

onUnmounted(() => {
    enterDrawStatus('')
})

// 绘制确认
function drawConfirm(type: string) {
    switch (type) {
        case (DRAW_CONFIRM.CANCEL):
            cancelDrawGraph()
            break
        case (DRAW_CONFIRM.STAGING):
            saveDrawGraph()
            break
        default: break
    }
    updateFlag(OPERATE_STATUS.NONE)
}
// 参数变化
const configChange = debounce(() => drawGraph.value?.updateConfig(attrForm), 500)
watch(() => attrForm, () => {
    // 有选中的绘制图形 或者处于 图形开始绘制后的右键结束绘制 状态
    if (modifyShape || flag.value === OPERATE_STATUS.ADD)
        configChange()
}, { deep: true })

// 绘制状态变化
watch(() => flag.value, () => {
    if (flag.value === OPERATE_STATUS.EDIT)
        editDrawGraph()
    else if (flag.value === OPERATE_STATUS.DELETE)
        removeDrawGraph()
})

defineExpose({ drawConfirm })
</script>

<template>
    <div class="p-1 b-1-white-solid rounded-1">
        <div class="mt-2 grid grid-cols-3 justify-items-center">
            <ElButton v-for="(item, key) in DRAW_GRAPH_MAP" :key="key" :class="`${drawingType === item.key ? 'active' : ''}`" class="public-cesium-btn mb-8 not-first:ml-0"
                @click="enterDrawStatus(item.key, OPERATE_STATUS.ADD)">
                <div class="relative h-12 w-12 flex-center-center">
                    <ElImage :src="requireImage(item.image)" fit />
                    <div class="absolute top-14">
                        {{ `${item.name}` }}
                    </div>
                </div>
            </ElButton>
        </div>
    </div>
</template>

<style lang="less" scoped>
.public-cesium-btn {
    border-radius: 100%;
    width: 48px;
    height: 48px;
}
</style>
