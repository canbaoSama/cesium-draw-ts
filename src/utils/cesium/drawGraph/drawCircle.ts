import type { Viewer } from 'cesium'

import {
    CallbackProperty, Cartesian3, ConstantProperty, PolygonGraphics, PolygonHierarchy, PolylineGraphics, ScreenSpaceEventHandler, ScreenSpaceEventType,
} from 'cesium'

import DrawGraphBase from './drawBase'
import { FLAG_MAP, PARAMS_MATERIAL_NAME } from './config'

import { computeCirclePolygon, computeCirclePolygon2, computeCircleRadius3D } from '@/utils/common'

import type { DrawCartesian3, DrawConfigIF, DrawEntity, DrawStagingData } from '@/types/index'

import { DRAW_GRAPH_MAP } from '@/constants/index'

export default class DrawGraphCircle extends DrawGraphBase {
    constructor(viewer: Viewer, options?: DrawConfigIF) {
        super(viewer, options)

        this.viewer = viewer
        this.drawHandler = new ScreenSpaceEventHandler(viewer.scene.canvas)
        this.drawType = DRAW_GRAPH_MAP.CIRCLE.key
    }

    computeCircleRadius3D = computeCircleRadius3D
    computeCirclePolygon = computeCirclePolygon
    computeCirclePolygon2 = computeCirclePolygon2

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
                this.leftClickEvent(cartesian)
            }
            this.positions.push(cartesian)
            if (num > 0)
                this.createPoint(cartesian, { oid: 1 })

            if (num > 1) {
                this.positions.pop()
                this.viewer.entities.remove(floatingPoint)
                this.tooltip.setVisible(false)
                this.clearDrawing()
                this.showModifyRegion2Map()
            }
        }, ScreenSpaceEventType.LEFT_CLICK)

        // 鼠标移动事件
        this.drawHandler?.setInputAction((movement: any) => {
            if (this.positions.length < 1) {
                this.tooltip.showAt(movement.endPosition, '选择起点')
                return
            }
            this.tooltip.showAt(movement.endPosition, '选择终点')

            const cartesian = this.checkPosition(movement.endPosition)
            if (!cartesian)
                return

            floatingPoint.position = this.transConstantPositionProperty(cartesian)
            this.positions.pop()
            this.positions.push(cartesian)
        }, ScreenSpaceEventType.MOUSE_MOVE)
    }

    // 绘制时绑定是左点击事件(第一次点击)
    leftClickEvent(cartesian: DrawCartesian3) {
        this.createCenter(cartesian, 0)
        this.showRegion2Map()
    }

    showRegion2Map(isModify?: boolean) {
        const positions = isModify ? this.tempPositions : this.positions
        if (!this.Materials.radiusLineType)
            this.computedLineMaterial(PARAMS_MATERIAL_NAME.RADIUS_LINE_TYPE)

        const dynamicHierarchy = new CallbackProperty(() => {
            if (positions.length > 1) {
                let dis = this.computeCircleRadius3D(positions)
                dis = parseFloat((dis / 1000).toFixed(3))
                if (this.entity?.label)
                    this.entity.label.text = this.transConstantProperty(`${dis}km`)
                const pnts = this.computeCirclePolygon(positions)
                const pHierarchy = new PolygonHierarchy(pnts)
                return pHierarchy
            }
            else
                return undefined
        }, false)
        const lineDynamicPositions = new CallbackProperty(() => {
            if (positions.length > 1)
                return positions

            else
                return undefined
        }, false)
        const labelDynamicPosition = new CallbackProperty(() => {
            if (positions.length > 1) {
                const p1 = positions[0]
                const p2 = positions[1]
                const cp = this.computeCenterPotition([p1, p2])
                return cp
            }
            else
                return new Cartesian3()
        }, false)
        let dis: string | number = ''
        if (isModify) {
            dis = this.computeCircleRadius3D(positions)
            dis = `${(dis / 1000).toFixed(3)}km`
        }
        const bData = {
            id: this.entityId,
            position: labelDynamicPosition,
            label: this.getCommonLabel(dis, { eyeOffset: new ConstantProperty(new Cartesian3(0, 0, 0)) }),
            polygon: new PolygonGraphics({
                hierarchy: dynamicHierarchy,
                material: this.rgbaStringToCesiumColor(this.config.fillColor),
                show: this.config.fill,
                // fill: this.config.fill,
                // outline: this.config.outline,
                // outlineWidth: this.config.outlineWidth,
            }),
            polyline: new PolylineGraphics({
                positions: lineDynamicPositions,
                clampToGround: true,
                width: this.config.radiusLineWidth,
                material: this.Materials.radiusLineType,
                show: true,
            }),
        }

        this.entity = this.viewer.entities.add(bData)
        this.setPublicParams()

        this.showCircleOutline2Map(isModify)
    }

    // 添加圆边框线条
    showCircleOutline2Map(isModify?: boolean) {
        if (!this.Materials.outlineType)
            this.computedLineMaterial(PARAMS_MATERIAL_NAME.OUTLINE_TYPE)

        const outelinePositions = new CallbackProperty(() => {
            const pnts = this.computeCirclePolygon(isModify ? this.tempPositions : this.positions)
            return pnts
        }, false)
        const bData = {
            polyline: {
                positions: outelinePositions,
                clampToGround: true,
                width: this.config.outlineWidth,
                material: this.Materials.outlineType,
            },
        }
        this.outlineEntity = this.viewer.entities.add(bData)
        this.outlineEntity.layerId = this.layerId
        this.outlineEntity.timeStampId = this.timeStampId
        this.outlineEntity.drawType = this.drawType
    }

    showModifyRegion2Map() {
        this.tempPositions = this.cloneDeep(this.positions)
        this.layerShowOrHide(true)
        this.createCenter(this.tempPositions[0], 0)
        this.createPoint(this.tempPositions[1], { oid: 1 })
        this.showRegion2Map(true)
        this.startModify()
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
                }
            }
            else {
                const pickedObject = this.checkModifyPosition(movement.position)
                if (!pickedObject)
                    return

                const entity = pickedObject.id
                if (entity.layerId !== this.layerId || entity.flag !== FLAG_MAP.ANCHOR)
                    return

                pickedAnchor = entity
                isMoving = true
                this.tooltip.showAt(movement.position, '移动控制点')
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
            if (typeof oid === 'number' && oid >= 0) {
                pickedAnchor.position = this.transConstantPositionProperty(cartesian)
                this.tempPositions[oid] = cartesian
            }
        }, ScreenSpaceEventType.MOUSE_MOVE)
    }

    // 创建中心位置
    createCenter(cartesian: DrawCartesian3, oid: number) {
        this.centerEntity = this.createPoint(cartesian, { oid, image: this.dragIcon, needSave: true, label: this.getCommonLabel() })
    }

    // 重新进入编辑状态
    reEnterModify(stagingData: DrawStagingData) {
        this.setReEnterParams(stagingData)
        this.tempPositions = this.cloneDeep(stagingData.saveData.positions)
        this.showModifyRegion2Map()
    }

    // 编辑取消,重新绘制旧数据
    drawOldData(stagingData: DrawStagingData) {
        this.setReEnterParams(stagingData)
        this.tempPositions = this.cloneDeep(stagingData.saveData.positions)
        this.createCenter(this.tempPositions[0], 0)
        this.showRegion2Map(true)
    }

    // 更新绘制的图形配置
    updateConfig(config: DrawConfigIF) {
        this.config = config
        if (this.entity && this.entity.polyline && this.entity.polygon && this.entity.label) {
            this.computedLineMaterial(PARAMS_MATERIAL_NAME.RADIUS_LINE_TYPE)
            this.entity.polyline.width = this.transConstantProperty(this.config.radiusLineWidth)
            this.entity.polyline.material = this.Materials.radiusLineType
            this.entity.polygon.material = this.transColorMaterialProperty(this.rgbaStringToCesiumColor(this.config.fillColor))
        }
        if (this.outlineEntity && this.outlineEntity.polyline) {
            this.computedLineMaterial(PARAMS_MATERIAL_NAME.OUTLINE_TYPE)
            this.outlineEntity.polyline.width = this.transConstantProperty(this.config.outlineWidth)
            this.outlineEntity.polyline.material = this.Materials.outlineType
        }
        if (this.centerEntity && this.centerEntity.label) {
            this.centerEntity.label.text = this.transConstantProperty(this.config.masthead ? this.config.name : '')
            this.centerEntity.name = this.config.description
            if (this.config.masthead)
                this.centerEntity.position = this.transConstantPositionProperty(this.tempPositions[0])
        }
    }
}
