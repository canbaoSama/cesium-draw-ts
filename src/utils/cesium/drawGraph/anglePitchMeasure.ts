import type { Viewer } from 'cesium'
import { CallbackProperty, Cartesian2, Cartesian3, Color, PolylineGlowMaterialProperty, ScreenSpaceEventHandler, ScreenSpaceEventType } from 'cesium'

import DrawGraphBase from './drawBase'
import { FLAG_MAP } from './config'

import { DRAW_GRAPH_MEASURE_MAP, ENTITY_LABEL_DEFAULT_CONFIG } from '@/constants/index'

import { change_3D_to_lonAndLat, radToDeg } from '@/utils/common'

import type { DrawCartesian3, DrawEntity } from '@/types/index'

export default class DrawGraphAnglePitchMeasure extends DrawGraphBase {
    constructor(viewer: Viewer) {
        super(viewer)

        this.viewer = viewer
        this.drawHandler = new ScreenSpaceEventHandler(viewer.scene.canvas)
        this.drawType = DRAW_GRAPH_MEASURE_MAP.SPACE_DIS_MEASURE.key
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
            this.createPoint(cartesian, { oid, image: this.dragIconGreen })

            if (this.positions.length > 2) {
                this.positions.pop()
                this.viewer.entities.remove(floatingPoint)
                this.tooltip.setVisible(false)
                // 进入编辑状态
                this.clearDrawing()
                this.showModifyPolyline2Map()
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

    // 添加线条
    showPolyline2Map(isModify?: boolean) {
        const positions = isModify ? this.tempPositions : this.positions
        if (!this.Materials.lineType)
            this.Materials.lineType = new PolylineGlowMaterialProperty({
                glowPower: 0.25,
                color: Color.fromCssColorString('#00f').withAlpha(0.9),
            })

        const dynamicPositions = new CallbackProperty(() => {
            return positions
        }, false)
        const center = this.positions[1] || this.positions[this.positions.length - 1]
        const text = positions.length >= 2 ? this.getMeasureTip(isModify ? this.tempPositions : this.positions) : ''

        const bData = {
            position: center,
            label: {
                text,
                ...ENTITY_LABEL_DEFAULT_CONFIG,
                pixelOffset: new Cartesian2(0, 40),
            },
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

    // 修改线条
    showModifyPolyline2Map() {
        this.tempPositions = this.cloneDeep(this.positions)
        this.startModify()
        this.showPolyline2Map(true)
        for (let i = 0; i < this.positions.length; i++)
            this.createPoint(this.positions[i], { oid: i, image: i === 0 ? this.dragIconGreen : '' })
    }

    // 启动修改
    startModify() {
        let isMoving = false
        let pickedAnchor: DrawEntity
        this.drawingToModify()
        // this.layerShowOrHide(true)

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
                    this.setLableParams(this.tempPositions)
                }
            }
            else {
                const pickedObject = this.checkModifyPosition(movement.position)
                if (!pickedObject)
                    return

                const entity = pickedObject.id
                if (entity.layerId !== this.layerId)
                    return
                if (entity.flag !== FLAG_MAP.ANCHOR)
                    return
                pickedAnchor = entity
                isMoving = true
                if (entity.flag === FLAG_MAP.ANCHOR)
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
                if (pickedAnchor.flag === FLAG_MAP.ANCHOR) {
                    pickedAnchor.position = this.transConstantPositionProperty(cartesian)
                    this.tempPositions[oid] = cartesian
                }
                this.setLableParams(this.tempPositions)
            }
        }, ScreenSpaceEventType.MOUSE_MOVE)
    }

    setLableParams(positions: Array<DrawCartesian3>) {
        if (this.entity) {
            this.entity.position = this.transConstantPositionProperty(positions[1])
            if (this.entity.label) {
                const text = this.getMeasureTip(positions)
                this.entity.label.text = this.transConstantProperty(text)
            }
        }
    }

    computeLineDis3d(pntList: Array<DrawCartesian3>) {
        const startLonLat = change_3D_to_lonAndLat(this.viewer, pntList[0])
        const endLonLat = change_3D_to_lonAndLat(this.viewer, pntList[1])
        const virtualLonLat = [endLonLat[0], endLonLat[1], startLonLat[2]]

        //  定义两条线的坐标
        const line1 = [pntList[0], pntList[1]]
        const line2 = [pntList[0], Cartesian3.fromDegrees(virtualLonLat[0], virtualLonLat[1], virtualLonLat[2])]

        // // 计算两条线的方向向量
        const direction1 = Cartesian3.subtract(line1[1], line1[0], new Cartesian3())
        const direction2 = Cartesian3.subtract(line2[1], line2[0], new Cartesian3())

        // // 计算两条线的俯仰角
        const pitchAngle1 = Cartesian3.angleBetween(direction1, direction2)

        // // 将弧度转换为角度
        let angleDegrees = radToDeg(pitchAngle1)

        if (angleDegrees > 90)
            angleDegrees = 180 - angleDegrees

        if (endLonLat[2] < startLonLat[2]) // 起点高度高于终点,为俯视角
            angleDegrees = 0 - angleDegrees

        return angleDegrees
    }

    getMeasureTip(pntList: Array<DrawCartesian3>) {
        let angleDegrees = this.computeLineDis3d(pntList)
        angleDegrees = parseFloat(angleDegrees.toFixed(3))
        const tip = `俯仰角：${angleDegrees} °`
        return tip
    }
}
