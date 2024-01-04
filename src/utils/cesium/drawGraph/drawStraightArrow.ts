import type { Viewer } from 'cesium'
import {
    CallbackProperty, Cartesian2, PolygonGraphics, PolygonHierarchy, ScreenSpaceEventHandler, ScreenSpaceEventType,
} from 'cesium'

import xp from './algorithm'

import DrawGraphBase from './drawBase'
import { FLAG_MAP, PARAMS_MATERIAL_NAME } from './config'

import type { DrawConfigIF, DrawEntity, DrawStagingData } from '@/types/index'

import { DRAW_GRAPH_MAP } from '@/constants/index'

export default class DrawGraphStraightArrow extends DrawGraphBase {
    constructor(viewer: Viewer, options?: DrawConfigIF) {
        super(viewer, options)

        this.viewer = viewer
        this.drawHandler = new ScreenSpaceEventHandler(viewer.scene.canvas)
        this.drawType = DRAW_GRAPH_MAP.STRAIGHT_ARROW.key
        // this.saveDraw = this._saveDraw
    }

    startDraw() {
        this.positions = []
        let floatingPoint: DrawEntity

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
            if (num > 1) {
                this.positions.pop()
                this.viewer.entities.remove(floatingPoint)
                this.tooltip.setVisible(false)
                this.clearDrawing()
                this.showModifyRegion2Map()
            }
        }, ScreenSpaceEventType.LEFT_CLICK)

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

            if (this.entity && this.config.masthead)
                this.entity.position = this.transConstantPositionProperty(this.computeCenterPotition(this.tempPositions))
        }, ScreenSpaceEventType.MOUSE_MOVE)
    }

    showRegion2Map(isModify?: boolean) {
        const positions = isModify ? this.tempPositions : this.positions
        if (!this.Materials.outlineType)
            this.computedLineMaterial(PARAMS_MATERIAL_NAME.OUTLINE_TYPE)

        const dynamicHierarchy = new CallbackProperty(() => {
            if (positions.length > 1) {
                const p1 = positions[0]
                const p2 = positions[1]
                if (this.isSimpleXYZ(p1, p2))
                    return undefined

                const firstPoint = this.change_3D_to_map_lonAndLat(p1)
                const endPoints = this.change_3D_to_map_lonAndLat(p2)
                const arrow = xp.algorithm.fineArrow([firstPoint.lon, firstPoint.lat], [endPoints.lon, endPoints.lat])
                const pHierarchy = new PolygonHierarchy(arrow)
                return pHierarchy
            }
            else
                return undefined
        }, false)
        const outlineDynamicPositions = new CallbackProperty(() => {
            if (positions.length < 2)
                return undefined

            const p1 = positions[0]
            const p2 = positions[1]
            if (this.isSimpleXYZ(p1, p2))
                return undefined

            const firstPoint = this.change_3D_to_map_lonAndLat(p1)
            const endPoints = this.change_3D_to_map_lonAndLat(p2)
            const arrow = xp.algorithm.fineArrow([firstPoint.lon, firstPoint.lat], [endPoints.lon, endPoints.lat])
            arrow.push(arrow[0])
            return arrow
        }, false)
        const bData = {
            name: this.config.description,
            label: this.getCommonLabel(this.config.masthead ? this.config.name : '', { pixelOffset: new Cartesian2(0, 0) }),
            position: this.computeCenterPotition(positions),
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
        this.tempPositions = this.cloneDeep(this.positions)
        this.startModify()
        this.showRegion2Map(true)
        for (let i = 0; i < this.tempPositions.length; i++)
            this.createPoint(this.tempPositions[i], { oid: i })
    }

    // 暂不使用
    _saveDraw() {
        this.saveClear()
        const p1 = this.tempPositions[0]
        const p2 = this.tempPositions[1]
        const firstPoint = this.change_3D_to_map_lonAndLat(p1)
        const endPoints = this.change_3D_to_map_lonAndLat(p2)
        const arrow = xp.algorithm.fineArrow([firstPoint.lon, firstPoint.lat], [endPoints.lon, endPoints.lat])
        return {
            saveData: {
                timeStampId: this.timeStampId,
                positions: arrow,
                locations: this.change_3D_to_lonAndLat_arr(arrow),
            },
            config: this.config,
        }
    }

    // 重新进入编辑状态
    reEnterModify(stagingData: DrawStagingData) {
        this.setReEnterParams(stagingData)
        this.tempPositions = this.cloneDeep(this.positions)
        this.showModifyRegion2Map()
    }

    // 编辑取消,重新绘制旧数据
    drawOldData(stagingData: DrawStagingData) {
        this.setReEnterParams(stagingData)
        this.tempPositions = this.cloneDeep(this.positions)
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
