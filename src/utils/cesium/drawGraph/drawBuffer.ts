import type { Cartesian3, Viewer } from 'cesium'
import { CallbackProperty, PolygonGraphics, PolygonHierarchy, ScreenSpaceEventHandler, ScreenSpaceEventType } from 'cesium'

import DrawGraphBase from './drawBase'
import { FLAG_MAP, PARAMS_MATERIAL_NAME } from './config'

import { computeBufferLine } from '@/utils/common'

import type { DrawConfigIF, DrawEntity, DrawStagingData } from '@/types/index'

import { DRAW_GRAPH_MAP } from '@/constants/index'

export default class DrawGraphBuffer extends DrawGraphBase {
    computeBufferLine = computeBufferLine

    constructor(viewer: Viewer, options?: DrawConfigIF) {
        super(viewer, options)

        this.viewer = viewer
        this.drawHandler = new ScreenSpaceEventHandler(viewer.scene.canvas)
        this.drawType = DRAW_GRAPH_MAP.BUFFER.key
    }

    startDraw() {
        this.positions = []
        let floatingPoint: DrawEntity
        this.drawHandler = new ScreenSpaceEventHandler(this.viewer.scene.canvas)

        this.drawHandler.setInputAction((movement: any) => {
            const cartesian = this.checkPosition(movement.position)
            if (!cartesian)
                return

            const num = this.positions.length
            if (num === 0) {
                this.positions.push(cartesian)
                floatingPoint = this.createPoint(cartesian, { oid: -1 })
                this.showRegion2Map()
            }
            this.positions.push(cartesian)
            const oid = this.positions.length - 2
            this.createPoint(cartesian, { oid })
        }, ScreenSpaceEventType.LEFT_CLICK)

        this.drawHandler.setInputAction((movement: any) => {
            if (this.positions.length < 1) {
                this.tooltip.showAt(movement.endPosition, '选择起点')
                return
            }
            const num = this.positions.length
            let tip = '点击添加下一个点'
            if (num > 2)
                tip += '右键结束绘制'

            this.tooltip.showAt(movement.endPosition, tip)

            const cartesian = this.checkPosition(movement.endPosition)
            if (!cartesian)
                return

            floatingPoint.position = this.transConstantPositionProperty(cartesian)
            this.positions.pop()
            this.positions.push(cartesian)
        }, ScreenSpaceEventType.MOUSE_MOVE)

        this.drawHandler.setInputAction(() => {
            if (this.positions.length < 3)
                return

            this.positions.pop()
            this.viewer.entities.remove(floatingPoint)
            this.tooltip.setVisible(false)

            // 进入编辑状态
            this.clearDrawing()
            this.showModifyRegion2Map()
        }, ScreenSpaceEventType.RIGHT_CLICK)
    }

    startModify() {
        let isMoving = false
        let pickedAnchor: DrawEntity
        this.drawingToModify()
        this.layerShowOrHide(true)

        this.modifyHandler = new ScreenSpaceEventHandler(this.viewer.scene.canvas)

        this.modifyHandler.setInputAction((movement: any) => {
            const cartesian = this.checkPosition(movement.position)
            if (!cartesian)
                return

            if (isMoving) {
                isMoving = false

                const oid = pickedAnchor.oid
                if (typeof oid === 'number' && oid >= 0) {
                    pickedAnchor.position = this.transConstantPositionProperty(cartesian)
                    this.tempPositions[oid] = cartesian
                    this.tooltip.setVisible(false)
                    if (pickedAnchor.flag === FLAG_MAP.MID_ANCHOR)
                        this.updateModifyAnchors(oid)
                }
            }
            else {
                const pickedObject = this.checkModifyPosition(movement.position)
                if (!pickedObject)
                    return

                const entity = pickedObject.id
                if (entity.layerId !== this.layerId)
                    return

                if (entity.flag !== 'anchor' && entity.flag !== 'mid_anchor')
                    return

                pickedAnchor = entity
                isMoving = true
                if (entity.flag === FLAG_MAP.ANCHOR)
                    this.tooltip.showAt(movement.position, '移动控制点')

                if (entity.flag === FLAG_MAP.MID_ANCHOR)
                    this.tooltip.showAt(movement.position, '移动创建新的控制点')
            }
        }, ScreenSpaceEventType.LEFT_CLICK)

        this.modifyHandler.setInputAction((movement: any) => {
            if (!isMoving)
                return

            this.tooltip.showAt(movement.endPosition, '移动控制点')

            const cartesian = this.checkPosition(movement.endPosition)
            if (!cartesian)
                return

            const oid = pickedAnchor.oid
            if (typeof oid === 'number' && oid >= 0)
                if (pickedAnchor.flag === FLAG_MAP.ANCHOR) {
                    pickedAnchor.position = this.transConstantPositionProperty(cartesian)
                    this.tempPositions[oid] = cartesian
                    // 左右两个中点
                    this.updateNewMidAnchors(oid)
                }
                else if (pickedAnchor.flag === FLAG_MAP.MID_ANCHOR) {
                    pickedAnchor.position = this.transConstantPositionProperty(cartesian)
                    this.tempPositions[oid] = cartesian
                }

            if (this.entity && this.config?.masthead)
                this.entity.position = this.transConstantPositionProperty(this.getArrMidElement(this.tempPositions))
        }, ScreenSpaceEventType.MOUSE_MOVE)
    }

    // 绘制指示的线条
    showRegion2Map() {
        if (!this.Materials.lineType)
            this.computedLineMaterial(PARAMS_MATERIAL_NAME.LINE_TYPE)

        const dynamicPositions = new CallbackProperty(() => {
            return this.positions
        }, false)
        const bData = {
            polyline: {
                positions: dynamicPositions,
                clampToGround: true,
                width: this.config.lineWidth,
                material: this.Materials.lineType,
            },
        }
        this.entity = this.viewer.entities.add(bData)
        this.setPublicParams()
    }

    // 绘制缓冲区
    showModifyRegion2MapCreateEntity() {
        if (!this.Materials.lineType)
            this.computedLineMaterial(PARAMS_MATERIAL_NAME.LINE_TYPE)

        const linePositions = new CallbackProperty(() => {
            return this.tempPositions
        }, false)
        const dynamicHierarchy = new CallbackProperty(() => {
            const pnts: Cartesian3[] | undefined = this.computeBufferLine(this.viewer, this.tempPositions, (this.config.radius || 1) * 1000) || undefined
            const pHierarchy = new PolygonHierarchy(pnts)
            return pHierarchy
        }, false)
        const bData = {
            name: this.config.description,
            label: this.getCommonLabel(),
            position: this.getArrMidElement(this.tempPositions),
            polygon: new PolygonGraphics({
                hierarchy: dynamicHierarchy,
                material: this.rgbaStringToCesiumColor(this.config.fillColor),
                show: this.config.fill,
            }),
            polyline: {
                positions: linePositions,
                clampToGround: true,
                width: this.config.lineWidth,
                material: this.Materials.lineType,
                show: this.config.line,
            },
        }
        this.entity = this.viewer.entities.add(bData)
        this.setPublicParams()
    }

    // 进入编辑状态
    showModifyRegion2Map() {
        this.tempPositions = this.cloneDeep(this.positions)
        this.computeTempPositions()
        this.showModifyRegion2MapCreateEntity()
        this.reCreateAllPoint()
        this.startModify()
    }

    // 重新进入编辑状态
    reEnterModify(stagingData: DrawStagingData) {
        this.setReEnterParams(stagingData)
        this.showModifyRegion2Map()
    }

    // 编辑取消,重新绘制旧数据
    drawOldData() {
        this.showModifyRegion2MapCreateEntity()
    }

    // 更新绘制的图形配置
    updateConfig(config: DrawConfigIF) {
        this.config = config
        this.updatePublicParams()
        if (this.entity && this.entity.polyline && this.entity.label && this.entity.polygon) {
            this.computedLineMaterial(PARAMS_MATERIAL_NAME.LINE_TYPE)
            this.entity.polyline.width = this.transConstantProperty(this.config.lineWidth)
            this.entity.polyline.material = this.Materials.lineType
            this.entity.polygon.material = this.transColorMaterialProperty(this.rgbaStringToCesiumColor(this.config.fillColor))
        }
    }
}
