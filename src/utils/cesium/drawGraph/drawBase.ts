import {
    Cartesian3, ColorMaterialProperty, ConstantPositionProperty, ConstantProperty, HeightReference,
    defined,
} from 'cesium'
import type {
    Color, ScreenSpaceEventHandler,
    Viewer,
} from 'cesium'
import { nextTick } from 'vue'
import { cloneDeep } from 'lodash-es'

import { FLAG_MAP, SAVE_NEED_UPDATE_POSITION, TEMP_POSITION_BY__COMPUTED, UNSAVE_DRAW_TYPE } from './config'

import { drawConfig } from './index'

import { DRAW_GRAPH_MAP, ENTITY_LABEL_DEFAULT_CONFIG } from '@/constants/index'

import { change_3D_to_lonAndLat_arr, change_3D_to_map_lonAndLat, checkPosition, computeCenterPotition, getArrMidElement, getLineMaterial, requireImage, rgbaStringToCesiumColor } from '@/utils/common'
import type { CreatePointOpt, DrawCartesian3, DrawConfigIF, DrawEntity, DrawStagingData, MaterialsIF, ParamsObjIF } from '@/types/index'
import { CreateTooltip } from '@/utils/cesium/tooltip'
import { OPERATE_STATUS } from '@/constants'

export default class DrawGraphBase extends CreateTooltip {
    viewer: Viewer
    drawHandler: ScreenSpaceEventHandler | undefined
    modifyHandler: ScreenSpaceEventHandler | undefined
    okHandler: ScreenSpaceEventHandler | undefined
    cancelHandler: ScreenSpaceEventHandler | undefined

    drawType = '' // 绘制图形是何种类型
    timeStampId = new Date().getTime() // 利用时间戳来记录,便于删除时进行判断
    options = {}

    drawStatus = OPERATE_STATUS.ADD // 绘制状态，分为新增，编辑

    layerDom: HTMLElement = <HTMLElement>document.getElementById('drawPopConfirmLayer')

    entity: DrawEntity | undefined // 当前绘制的 entity
    centerEntity: DrawEntity | undefined // 中心点的 entity
    outlineEntity: DrawEntity | undefined // 边框线条的 entity
    entityId: undefined | string // 定义的需要绘制的图形entity的id，如果想要让cesium自己生成，则设为undefined

    positions: Array<DrawCartesian3> = [] // 绘制时的点位置数组
    tempPositions: Array<DrawCartesian3> = [] // 编辑时的点位置数组
    markers: { [key: number | string]: DrawEntity } = {} // 记录的 entity
    saveMarkers: { [key: number | string]: DrawEntity } = {} // 同 markers,但是这里保存的是需要保留的锚点,只有在取消绘制时才能删除

    dragIconLight = drawConfig.dragIconLight // 绘制时的红点
    dragIcon = drawConfig.dragIcon // 绘制时的灰点
    dragIconGreen = drawConfig.dragIconGreen

    layerId = drawConfig.layerId

    config: DrawConfigIF & { [key: string]: any } = {
        name: drawConfig.name,
        description: drawConfig.description,
        masthead: drawConfig.masthead,

        lineType: drawConfig.lineType, // 线型
        lineColor: drawConfig.lineColor, // 线条颜色
        lineWidth: drawConfig.lineWidth, // 线宽

        outlineType: drawConfig.outlineType, // 线型
        outlineColor: drawConfig.outlineColor, // 线条颜色
        outlineWidth: drawConfig.outlineWidth, // 线宽

        radiusLineType: drawConfig.radiusLineType, // 线型
        radiusLineColor: drawConfig.radiusLineColor, // 线条颜色
        radiusLineWidth: drawConfig.radiusLineWidth, // 线宽

        fillColor: drawConfig.fillColor, // 颜色

        fill: drawConfig.fill,
        outline: drawConfig.outline,
        extrudedHeight: drawConfig.extrudedHeight,
        radius: drawConfig.radius,
        line: drawConfig.line,
    }

    Materials: MaterialsIF & { [key: string]: any } = {
        lineType: undefined,
        outlineType: undefined,
        radiusLineType: undefined,
    }

    rgbaStringToCesiumColor = rgbaStringToCesiumColor
    cloneDeep = cloneDeep
    getArrMidElement = getArrMidElement
    computeCenterPotition = computeCenterPotition // 计算所有点位的中间点,点位可能在图形外，如果要保持在图形内部，需要引入额外的库，使用凸包算法

    constructor(viewer: Viewer) {
        super()
        this.viewer = viewer
        this.timeStampId = new Date().getTime()

        nextTick(() => {
            this.init()
        })
    }

    init() {
        const layerDom = document.getElementById('drawPopConfirmLayer')
        if (layerDom)
            this.layerDom = layerDom
    }

    createPoint(cartesian: DrawCartesian3, options: CreatePointOpt) {
        const point: DrawEntity = this.viewer.entities.add({
            name: this.config.description || '',
            position: cartesian,
            label: options.label || {},
            billboard: {
                image: requireImage(options.image || this.dragIconLight),
                eyeOffset: new ConstantProperty(new Cartesian3(0, 0, -500)),
                heightReference: HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
        })
        point.oid = options.oid
        point.layerId = this.layerId
        point.flag = options.flag || FLAG_MAP.ANCHOR
        point.timeStampId = this.timeStampId
        point.drawType = DRAW_GRAPH_MAP.POINT.key

        if (options.needSave)
            this.saveMarkers[options.oid] = point

        else // 不需要保留的点需要放入markers
            this.markers[options.oid] = point

        if (point.flag === FLAG_MAP.ANCHOR) // 左键点击生成的点,线头点
            point.sid = cartesian?.sid // 记录原始序号

        // }

        return point
    }

    reCreateAllPoint() {
        const positions = this.tempPositions
        for (let i = 0; i < positions.length; i++) {
            const ys = i % 2
            if (ys === 0)
                this.createPoint(positions[i], { oid: i })
            else
                this.createPoint(positions[i], { oid: i, flag: FLAG_MAP.MID_ANCHOR, image: this.dragIcon })
        }
    }

    updateModifyAnchors(oid: number) {
        const num = this.tempPositions.length
        if (oid === 0 || oid === num - 1)
            return

        // 重新计算tempPositions
        const p = this.tempPositions[oid]
        const p1 = this.tempPositions[oid - 1]
        const p2 = this.tempPositions[oid + 1]

        // 计算中心
        const cp1 = this.computeCenterPotition([p1, p])
        const cp2 = this.computeCenterPotition([p, p2])

        // 插入点
        this.tempPositions.splice(oid, 1, cp1, p, cp2)

        // 重新加载锚点
        this.clearAnchors()
        this.reCreateAllPoint()
    }

    // polygon 因为要首尾连接,并且产生中间锚点,所以计算方式不同
    _updateModifyAnchors(oid: number) {
        // 重新计算tempPositions
        const p = this.tempPositions[oid]
        let p1 = null
        let p2 = null
        const num = this.tempPositions.length
        if (oid === 0) {
            p1 = this.tempPositions[num - 1]
            p2 = this.tempPositions[oid + 1]
        }
        else if (oid === num - 1) {
            p1 = this.tempPositions[oid - 1]
            p2 = this.tempPositions[0]
        }
        else {
            p1 = this.tempPositions[oid - 1]
            p2 = this.tempPositions[oid + 1]
        }
        // 计算中心
        const cp1 = this.computeCenterPotition([p1, p])
        const cp2 = this.computeCenterPotition([p, p2])

        // 插入点
        this.tempPositions.splice(oid, 1, cp1, p, cp2)

        // 重新加载锚点
        this.clearAnchors()
        this.reCreateAllPoint()
    }

    // 更新中间锚点位置
    updateNewMidAnchors(oid: number) {
        if (oid === null || oid === undefined)
            return

        // 左边两个中点，oid2为临时中间点
        let oid1
        let oid2
        // 右边两个中点，oid3为临时中间点
        let oid3
        let oid4

        const num = this.tempPositions.length
        if (oid === 0) {
            oid1 = num - 2
            oid2 = num - 1
            oid3 = oid + 1
            oid4 = oid + 2
        }
        else if (oid === num - 2) {
            oid1 = oid - 2
            oid2 = oid - 1
            oid3 = num - 1
            oid4 = 0
        }
        else {
            oid1 = oid - 2
            oid2 = oid - 1
            oid3 = oid + 1
            oid4 = oid + 2
        }

        const c1 = this.tempPositions[oid1]
        const c = this.tempPositions[oid]
        const c4 = this.tempPositions[oid4]

        if (oid === 0) {
            const c3 = this.computeCenterPotition([c4, c])
            this.tempPositions[oid3] = c3
            this.markers[oid3].position = this.transConstantPositionProperty(c3)
        }
        else if (oid === num - 1) {
            const c2 = this.computeCenterPotition([c1, c])
            this.tempPositions[oid2] = c2
            this.markers[oid2].position = this.transConstantPositionProperty(c2)
        }
        else {
            const c2 = this.computeCenterPotition([c1, c])
            const c3 = this.computeCenterPotition([c4, c])
            this.tempPositions[oid2] = c2
            this.tempPositions[oid3] = c3
            this.markers[oid2].position = this.transConstantPositionProperty(c2)
            this.markers[oid3].position = this.transConstantPositionProperty(c3)
        }
    }

    // 计算模板位置信息,首尾节点不需要连接在一起
    computeTempPositions() {
        const pnts = cloneDeep(this.positions)
        const num = pnts.length
        this.tempPositions = []
        for (let i = 1; i < num; i++) {
            const p1 = pnts[i - 1]
            const p2 = pnts[i]
            p1.sid = i - 1
            p2.sid = i
            const cp = this.computeCenterPotition([p1, p2])
            this.tempPositions.push(p1)
            this.tempPositions.push(cp)
        }
        const last = pnts[num - 1]
        this.tempPositions.push(last)
    }

    // 计算模板位置信息,首尾节点需要连接在一起
    _computeTempPositions() {
        const pnts = this.cloneDeep(this.positions)
        let num = pnts.length
        const first = pnts[0]
        const last = pnts[num - 1]
        if (this.isSimpleXYZ(first, last) === false) {
            pnts.push(first)
            num += 1
        }
        this.tempPositions = []
        for (let i = 1; i < num; i++) {
            const p1 = pnts[i - 1]
            const p2 = pnts[i]
            const cp = this.computeCenterPotition([p1, p2])
            this.tempPositions.push(p1)
            this.tempPositions.push(cp)
        }
    }

    // 根据线条类型计算要渲染使用的线条材质
    computedLineMaterial(paramsObj: ParamsObjIF) {
        this.Materials[paramsObj.type] = getLineMaterial(this.config[paramsObj.type], this.config[paramsObj.color])
    }

    // 设置公共的必须参数
    setPublicParams() {
        if (this.entity) {
            this.entity.layerId = this.layerId
            this.entity.timeStampId = this.timeStampId
            this.entity.drawType = this.drawType
        }
    }

    // 设置配置参数的公共部分
    updatePublicParams() {
        if (this.entity) {
            if (this.entity.label) {
                this.entity.label.text = this.transConstantProperty(this.config.masthead ? this.config.name : '')
                this.entity.name = this.config.description
            }
            if (this.config.masthead)
                this.entity.position = this.transConstantPositionProperty(this.computeCenterPotition(this.tempPositions))
        }
    }

    // 外部更新tempPositions
    updateTempPositions(positions: Cartesian3[]) {
        this.positions = cloneDeep(positions)
        if (SAVE_NEED_UPDATE_POSITION.includes(this.drawType))
            TEMP_POSITION_BY__COMPUTED.includes(this.drawType) ? this._computeTempPositions() : this.computeTempPositions()
        else
            this.tempPositions = cloneDeep(positions)

        if (this.entity)
            this.entity.position = this.transConstantPositionProperty(this.getArrMidElement(this.positions))

        Object.keys(this.markers).forEach((key, index) => {
            if (this.markers[key])
                this.markers[key].position = this.transConstantPositionProperty(this.tempPositions[index])
        })
    }

    // 绘制状态转成编辑
    drawingToModify() {
        this.drawStatus = OPERATE_STATUS.EDIT
        this.clearDrawHandler()
    }

    // 重新进入绘制图形或进入编辑时需要设置的公共参数
    setReEnterParams(stagingData: DrawStagingData) {
        this.positions = stagingData.saveData.positions
        if (stagingData.saveData.timeStampId)
            this.timeStampId = stagingData.saveData.timeStampId
        if (stagingData.config)
            this.config = stagingData.config
    }

    // 检查 position
    checkPosition(position: Cartesian3) {
        return checkPosition(this.viewer, position)
    }

    // 检查修改时的 position
    checkModifyPosition(position: Cartesian3) {
        const pickedObject = this.viewer.scene.pick(position)
        if (!defined(pickedObject) || !defined(pickedObject.id))
            return false
        return pickedObject
    }

    // 弹出的 layer (保存或取消的确认框)
    layerShowOrHide(status: boolean) {
        if (this.layerDom)
            this.layerDom.style.display = status ? 'block' : 'none'
    }

    // 获取标头的通用展示
    getCommonLabel(text?: string, options?: object) {
        return {
            text: text || (this.config.masthead ? this.config.name : ''),
            ...ENTITY_LABEL_DEFAULT_CONFIG,
            ...options,
        }
    }

    // 保存绘制的图形
    saveDraw() {
        if (UNSAVE_DRAW_TYPE.includes(this.drawType)) { // 这些作为工具类提示的绘制类型，不需要保存
            this.clearDrawing()
            return false
        }
        else {
            this.saveClear()
            // 重新更新positions作为储存已绘制记录
            if (SAVE_NEED_UPDATE_POSITION.includes(this.drawType)) {
                const positions = []
                for (let i = 0; i < this.tempPositions.length; i += 2) {
                    const p = this.tempPositions[i]
                    positions.push(p)
                }
                this.tempPositions = cloneDeep(positions)
            }
            let saveData: any
            switch (this.drawType) {
                case DRAW_GRAPH_MAP.BUFFER.key:
                    saveData = {
                        timeStampId: this.timeStampId,
                        radius: this.config.radius,
                        positions: this.tempPositions,
                        locations: this.change_3D_to_lonAndLat_arr(this.tempPositions),
                    }
                    break
                default:
                    saveData = {
                        timeStampId: this.timeStampId,
                        positions: this.tempPositions,
                        locations: this.change_3D_to_lonAndLat_arr(this.tempPositions),
                    }
                    break
            }

            return { saveData, config: this.config }
        }
    }

    // 清除 drawHandler
    clearDrawHandler() {
        if (this.drawHandler) {
            this.drawHandler.destroy()
            this.drawHandler = undefined
        }
    }

    // 清除 modifyHandler,退出编辑状态
    clearModifyHandler() {
        if (this.modifyHandler) {
            this.modifyHandler.destroy()
            this.modifyHandler = undefined
        }
        this.layerShowOrHide(false)
    }

    // 清除锚点
    clearAnchors() {
        for (const key in this.markers) {
            const m = this.markers[key]
            this.viewer.entities.remove(m)
        }
        this.markers = {}
    }

    // 清除保留锚点
    clearSavedAnchors() {
        for (const key in this.saveMarkers) {
            const m = this.saveMarkers[key]
            this.viewer.entities.remove(m)
        }
        this.saveMarkers = {}
    }

    // 清除 outlineEntity
    clearOutlineEntity() {
        if (this.outlineEntity)
            this.viewer.entities.remove(this.outlineEntity)
    }

    // 移除相关场景,包括绘制的图形
    clearMarkers(layerName: string) {
        const entityList: Array<DrawEntity> = this.viewer.entities.values
        if (!entityList || entityList.length < 1)
            return
        for (let i = 0; i < entityList.length; i++) {
            const entity = entityList[i]
            if (entity.layerId === layerName) {
                this.viewer.entities.remove(entity)
                i--
            }
        }
    }

    // 移除材料计算
    clearMaterials() {
        this.Materials = {
            lineType: undefined,
            outlineType: undefined,
            radiusLineType: undefined,
        }
    }
    /**
     * 清除总共应该分为 4 种情况,对应下面4个方法
     * 1. 清除所有监听 + tooltip,比如初始化的时候就应该先清除之前 class 里添加的监听
     * 2. 保存时清除锚点和所有监听 + tooltip
     * 3. 取消绘制时或者切换绘制方式时默认清除当前正在绘制的图形,同时清除所有监听和锚点 + tooltip
     * 4. 清除所有绘制相关,包括监听,锚点以及绘制的图形
     */

    // 清除所有handler监听
    clearHandler() {
        this.clearDrawHandler()
        this.clearModifyHandler()
        this.tooltip.setVisible(false)
    }

    // 保存时清除监听和锚点并返回位置数据信息
    saveClear() {
        this.clearHandler()
        if (this.drawType !== DRAW_GRAPH_MAP.POINT.key) // 绘制点的时候不能清除锚点
            this.clearAnchors()
    }

    // 清除当前绘制的数据
    clearDrawing() {
        this.clearMaterials()
        this.clearHandler()
        this.clearAnchors()
        this.clearSavedAnchors()
        this.clearOutlineEntity()
        if (this.entity)
            this.viewer.entities.remove(this.entity)
        this.tooltip.setVisible(false)
    }

    // 清除所有绘制相关
    clear() {
        this.clearHandler()
        this.clearMarkers(this.layerId)
        this.clearOutlineEntity()
        this.tooltip.setVisible(false)
    }

    getLonLatArr(positions: Array<DrawCartesian3>) {
        const arr = []
        for (let i = 0; i < positions.length; i++) {
            const p = this.change_3D_to_map_lonAndLat(positions[i])
            if (p !== undefined)
                arr.push([p.lon, p.lat])
        }
        return arr
    }

    // 判断位置信息是否完全相同
    isSimpleXYZ(p1: Cartesian3, p2: Cartesian3) {
        if (p1.x === p2.x && p1.y === p2.y && p1.z === p2.z)
            return true

        return false
    }

    // 多个3D坐标转为经纬度,数组形式
    change_3D_to_lonAndLat_arr(positions: Array<DrawCartesian3>) {
        return change_3D_to_lonAndLat_arr(this.viewer, positions)
    }

    change_3D_to_map_lonAndLat(position: DrawCartesian3) {
        return change_3D_to_map_lonAndLat(this.viewer, position)
    }

    transConstantProperty(value: any) {
        return new ConstantProperty(value)
    }

    transColorMaterialProperty(color: Color) {
        return new ColorMaterialProperty(color)
    }

    transConstantPositionProperty(value?: Cartesian3 | undefined) {
        return new ConstantPositionProperty(value)
    }
}
