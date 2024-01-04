import type { Ref } from 'vue'
import { provide, ref, watch } from 'vue'
import { cloneDeep } from 'lodash-es'
import type { Viewer } from 'cesium'

import { DRAW_GRAPH_MAP, DRAW_GRAPH_MEASURE_MAP, OPERATE_STATUS } from '@/constants/index'
import { drawFunc } from '@/utils/cesium/drawGraph'
import { SAVE_NEED_UPDATE_POSITION, params } from '@/utils/cesium/drawGraph/config'
import { change_3D_to_lonAndLat_arr } from '@/utils/common'
import type { DrawConfigIF, DrawStagingData } from '@/types/index'

export function useDrawGraph() {
    const viewer: Ref<Viewer | undefined> = ref()
    const containerId = ref('viewerContainer')
    const flag: Ref<string> = ref(OPERATE_STATUS.NONE)
    const drawingType: Ref<string> = ref('')
    const drawedShape: Ref<{ [key: number]: DrawStagingData }> = ref({}) // 保存的已经绘制的图形数据信息
    const modifyShape: Ref<DrawStagingData | undefined> = ref() // 选中的编辑图形，包括正在绘制的图形
    const drawingPos: Ref<Array<number[]>> = ref([])

    const attrForm: Ref<DrawConfigIF> = ref(cloneDeep(params)) // 扩展运算符是浅拷贝，如果一个对象的属性全部由扩展运算符生成，会变成对象的引用

    const drawGraph = ref() // 这些创建的class类，只有创建成功并使用其内部方法后，才会变为响应式，我也没理解，但是确实是这样的

    function acceptProps(viewerContainer: Viewer, viewerContainerId: string) {
        viewer.value = viewerContainer
        containerId.value = viewerContainerId
    }
    function updateFlag(type: string) { // 只能通过页面按钮控制flag
        if (type === flag.value)
            return
        flag.value = type
    }

    // 绘制状态变化，可能是没有选中的图形的，所以需要滞空
    watch(flag, () => {
        modifyShape.value = undefined
        drawingPos.value = []
        attrForm.value = cloneDeep(params)
    })

    // 下面两个watch 主要是绘制的监听
    watch(() => drawGraph.value?.positions, (val) => {
        if (val && Array.isArray(val) && viewer.value)
            drawingPos.value = change_3D_to_lonAndLat_arr(viewer.value, val)
    }, { deep: true })
    // tempPositions 是包含线条的中间点的
    watch(() => drawGraph.value?.tempPositions, (val) => {
        if (val && drawGraph.value?.drawStatus === OPERATE_STATUS.EDIT && viewer.value) {
            const locations = change_3D_to_lonAndLat_arr(viewer.value, val)
            let showLocations = []
            if (SAVE_NEED_UPDATE_POSITION.includes(drawingType.value))
                for (let i = 0; i < locations.length; i++) {
                    if (i % 2 === 0)
                        showLocations.push(locations[i])
                }

            else
                showLocations = locations

            if (flag.value === OPERATE_STATUS.ADD) // 初始绘制停止进入编辑状态，不同于重新进入编辑状态
                drawingPos.value = showLocations

            else
                if (modifyShape.value)
                    modifyShape.value.saveData.locations = []

                else
                    modifyShape.value = {
                        saveData: {
                            locations: showLocations,
                            positions: [],
                        },
                    }
        }
    }, { deep: true })

    function DrawGraphType(drawType: string) {
        if (drawGraph.value?.drawHandler || drawGraph.value?.modifyHandler) // 还处于绘制状态,要清除当前绘制信息
            drawGraph.value.clearDrawing()
        drawGraph.value?.clearHandler()
        if (drawType)
            drawGraph.value = new drawFunc[(DRAW_GRAPH_MAP[drawType] || DRAW_GRAPH_MEASURE_MAP[drawType])?.drawFunc](viewer.value)

        else drawGraph.value = undefined
    }

    const provideData = {
        viewer,
        acceptProps,

        flag,
        updateFlag,

        drawingType,
        drawGraph,
        DrawGraphType,
        drawedShape,
        modifyShape,
        drawingPos,

        attrForm,
    }
    provide('drawStore', provideData)

    return provideData
}
