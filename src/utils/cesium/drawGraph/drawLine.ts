import type { Viewer } from 'cesium'
import { CallbackProperty, ScreenSpaceEventHandler, ScreenSpaceEventType } from 'cesium'

import DrawGraphBase from './drawBase'
import { FLAG_MAP, PARAMS_MATERIAL_NAME } from './config'

import type { DrawConfigIF, DrawEntity, DrawStagingData } from '@/types/index'

import { DRAW_GRAPH_MAP } from '@/constants/index'

export default class DrawGraphLine extends DrawGraphBase {
    constructor(viewer: Viewer) {
        super(viewer)

        this.viewer = viewer
        this.drawHandler = new ScreenSpaceEventHandler(viewer.scene.canvas)
        this.drawType = DRAW_GRAPH_MAP.LINE.key
    }

    // 开始绘制线条
    startDraw() {
        let floatingPoint: DrawEntity
        this.positions = []
        // 鼠标左键点击事件
        this.drawHandler?.setInputAction((movement: any) => {
            const cartesian = this.checkPosition(movement.position)
            if (!cartesian)
                return

            const num = this.positions.length
            if (num === 0) {
                this.positions.push(cartesian)
                floatingPoint = this.createPoint(cartesian, { oid: -1 })
                this.showPolyline2Map()
            }

            this.positions.push(cartesian)
            const oid = this.positions.length - 2
            this.createPoint(cartesian, { oid })
        }, ScreenSpaceEventType.LEFT_CLICK)

        // 鼠标移动事件
        this.drawHandler?.setInputAction((movement: any) => {
            if (this.positions.length < 1) {
                this.tooltip.showAt(movement.endPosition, '选择起点')
                return
            }
            let tip = '点击添加下一个点'
            const num = this.positions.length
            if (num > 2)
                tip += '或右键结束绘制'
            this.tooltip.showAt(movement.endPosition, tip)

            const cartesian = this.checkPosition(movement.endPosition)
            if (!cartesian)
                return

            floatingPoint.position = this.transConstantPositionProperty(cartesian)
            this.positions.pop()
            this.positions.push(cartesian)
        }, ScreenSpaceEventType.MOUSE_MOVE)

        // 鼠标右键事件
        this.drawHandler?.setInputAction(() => {
            if (this.positions.length < 3)
                return

            this.positions.pop()
            this.viewer.entities.remove(floatingPoint)
            this.tooltip.setVisible(false)

            // 进入编辑状态
            this.clearDrawing()
            this.showModifyPolyline2Map()
        }, ScreenSpaceEventType.RIGHT_CLICK)
    }

    // 添加线条
    showPolyline2Map(isModify?: boolean) {
        if (!this.Materials.lineType)
            this.computedLineMaterial(PARAMS_MATERIAL_NAME.LINE_TYPE)

        const dynamicPositions = new CallbackProperty(() => {
            return isModify ? this.tempPositions : this.positions
        }, false)

        const bData = {
            name: this.config.description,
            polyline: {
                positions: dynamicPositions,
                clampToGround: true,
                width: this.config.lineWidth,
                material: this.Materials.lineType,
            },
            label: this.getCommonLabel(),
            position: this.getArrMidElement(this.positions),
        }
        this.entity = this.viewer.entities.add(bData)
        this.setPublicParams()
    }

    // 修改线条
    showModifyPolyline2Map() {
        this.layerShowOrHide(true)
        this.startModify()
        this.computeTempPositions()
        this.showPolyline2Map(true)
        this.reCreateAllPoint()
    }

    // 启动修改
    startModify() {
        let isMoving = false
        let pickedAnchor: DrawEntity
        this.drawingToModify()

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
                if (entity.flag !== FLAG_MAP.ANCHOR && entity.flag !== FLAG_MAP.MID_ANCHOR)
                    return
                pickedAnchor = entity
                isMoving = true
                this.tooltip.showAt(movement.position, entity.flag === FLAG_MAP.ANCHOR ? '移动控制点' : '移动创建新的控制点')
            }
        }, ScreenSpaceEventType.LEFT_CLICK)

        this.modifyHandler.setInputAction((movement: any) => {
            if (!isMoving)
                return

            this.tooltip.showAt(movement.endPosition, pickedAnchor.flag === FLAG_MAP.ANCHOR ? '移动控制点' : '移动创建新的控制点')

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

    reEnterModify(stagingData: DrawStagingData) {
        this.setReEnterParams(stagingData)
        this.showModifyPolyline2Map()
    }

    drawOldData(stagingData: DrawStagingData) {
        this.setReEnterParams(stagingData)
        this.computeTempPositions()
        this.showPolyline2Map()
    }

    // 更新绘制的图形配置
    updateConfig(config: DrawConfigIF) {
        this.config = config
        this.updatePublicParams()
        if (this.entity && this.entity.polyline && this.entity.label) {
            this.computedLineMaterial(PARAMS_MATERIAL_NAME.LINE_TYPE)
            this.entity.polyline.width = this.transConstantProperty(this.config.lineWidth)
            this.entity.polyline.material = this.Materials.lineType
        }
    }
}
