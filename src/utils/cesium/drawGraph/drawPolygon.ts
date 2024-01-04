import type { Viewer } from 'cesium'
import { CallbackProperty, Cartesian2, PolygonGraphics, PolygonHierarchy, ScreenSpaceEventHandler, ScreenSpaceEventType } from 'cesium'

import DrawGraphBase from './drawBase'
import { FLAG_MAP, PARAMS_MATERIAL_NAME } from './config'

import type { DrawConfigIF, DrawEntity, DrawStagingData } from '@/types/index'

import { DRAW_GRAPH_MAP } from '@/constants/index'

export default class DrawGraphPolygon extends DrawGraphBase {
    constructor(viewer: Viewer) {
        super(viewer)

        this.viewer = viewer
        this.drawHandler = new ScreenSpaceEventHandler(viewer.scene.canvas)
        this.drawType = DRAW_GRAPH_MAP.POLYGON.key
    }

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
                this.showRegion2Map()
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
            if (this.positions.length < 4)
                return

            this.positions.pop()
            this.viewer.entities.remove(floatingPoint)
            this.tooltip.setVisible(false)

            // 进入编辑状态
            this.clearDrawing()
            this.showModifyRegion2Map()
        }, ScreenSpaceEventType.RIGHT_CLICK)
    }

    showRegion2Map(isModify?: boolean) {
        if (!this.Materials.outlineType)
            this.computedLineMaterial(PARAMS_MATERIAL_NAME.OUTLINE_TYPE)

        const dynamicHierarchy = new CallbackProperty(() => {
            if (this.positions.length > 2) {
                const pHierarchy = new PolygonHierarchy(isModify ? this.tempPositions : this.positions)
                return pHierarchy
            }
            else
                return undefined
        }, false)
        const outlineDynamicPositions = new CallbackProperty(() => {
            if (this.positions.length > 1) {
                const arr = this.cloneDeep(isModify ? this.tempPositions : this.positions)
                const first = isModify ? this.tempPositions[0] : this.positions[0]
                arr.push(first)
                return arr
            }
            else
                return undefined
        }, false)
        const bData = {
            id: this.entityId,
            name: this.config.description,
            label: this.getCommonLabel(this.config.masthead ? this.config.name : '', { pixelOffset: new Cartesian2(0, 0) }),
            position: this.computeCenterPotition(this.positions),

            polygon: new PolygonGraphics({
                hierarchy: dynamicHierarchy,
                material: this.rgbaStringToCesiumColor(this.config.fillColor),
                show: this.config.fill,
            }),
            polyline: {
                positions: outlineDynamicPositions,
                clampToGround: true,
                width: this.config.outlineWidth,
                material: this.Materials.outlineType,
                show: this.config.outline,
            },
        }
        this.entity = this.viewer.entities.add(bData)
        this.setPublicParams()
    }

    showModifyRegion2Map() {
        this.startModify()
        this._computeTempPositions()

        this.showRegion2Map(true)
        this.reCreateAllPoint()
    }

    // 启动修改
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
                        this._updateModifyAnchors(oid)
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
                    this._updateNewMidAnchors(oid)
                }
                else if (pickedAnchor.flag === FLAG_MAP.MID_ANCHOR) {
                    pickedAnchor.position = this.transConstantPositionProperty(cartesian)
                    this.tempPositions[oid] = cartesian
                }

            if (this.entity && this.config?.masthead)
                this.entity.position = this.transConstantPositionProperty(this.computeCenterPotition(this.tempPositions))
        }, ScreenSpaceEventType.MOUSE_MOVE)
    }

    _updateNewMidAnchors(oid: number) {
        if (oid === null || oid === undefined)
            return

        // 左边两个中点，oid2为临时中间点
        let oid1 = null
        let oid2 = null

        // 右边两个中点，oid3为临时中间点
        let oid3 = null
        let oid4 = null
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

        const c2 = this.computeCenterPotition([c1, c])
        const c3 = this.computeCenterPotition([c4, c])

        this.tempPositions[oid2] = c2
        this.tempPositions[oid3] = c3

        this.markers[oid2].position = this.transConstantPositionProperty(c2)
        this.markers[oid3].position = this.transConstantPositionProperty(c3)
    }

    // 重新进入编辑状态
    reEnterModify(stagingData: DrawStagingData) {
        this.setReEnterParams(stagingData)
        this.showModifyRegion2Map()
    }

    // 编辑取消,重新绘制旧数据
    drawOldData(stagingData: DrawStagingData) {
        this.setReEnterParams(stagingData)
        this._computeTempPositions()
        this.showRegion2Map()
    }

    // 更新绘制的图形配置
    updateConfig(config: DrawConfigIF) {
        this.config = config
        this.updatePublicParams()
        if (this.entity && this.entity.polyline && this.entity.label && this.entity.polygon) {
            this.computedLineMaterial(PARAMS_MATERIAL_NAME.OUTLINE_TYPE)
            this.entity.polyline.width = this.transConstantProperty(this.config.outlineWidth)
            this.entity.polyline.material = this.Materials.outlineType
            this.entity.polygon.material = this.transColorMaterialProperty(this.rgbaStringToCesiumColor(this.config.fillColor))
        }
    }
}
