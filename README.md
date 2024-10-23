## 基于 vue3 + Element-plus 封装的 cesium 绘制赋值界面和方法

### 功能列表

1. 提供 UI 组件进行基础图形绘制，支持实时修改参数；暴露绘制参数到外部；
2. 支持调用内部方法触发绘制，无需引入 UI 组件；
3. 内部提供了一些其他的绘制和测量方法，如坐标查询，空间距离，贴地距离和面积量算等，具体查看绘制方法解析；

![Description](https://github.com/canbaoSama/cesium-draw-ts/blob/main/public/cesium-draw.png?raw=true)

### 使用如下

#### 安装 cesium-draw-ts 包

```bash
npm i cesium-draw-ts
```

#### 安装 element-plus

```bash
npm i element-plus
```

#### 引入 element-plus 的相关组件

```ts
import "element-plus/theme-chalk/index.css";
import { ElButton, ElColorPicker, ElForm, ElFormItem, ElImage, ElInput, ElInputNumber, ElOption, ElScrollbar, ElSelect, ElSwitch } from "element-plus";

app.use(ElButton).use(ElForm).use(ElInput).use(ElImage).use(ElScrollbar).use(ElInputNumber).use(ElSwitch).use(ElColorPicker).use(ElFormItem).use(ElSelect).use(ElOption);
```

#### 引入 UI 组件辅助绘制方式

以绘制折线为例,执行以下代码就可以在你的 cesium 地图上开始绘制你的线条了

```vue
<script setup lang="ts">
import "/node_modules/cesium-draw-ts/dist/style.css";
import { DrawModel } from "cesium-draw-ts";
import { ref } from "vue";
import { Viewer } from "cesium";

const show = ref(false);
const viewer = new Viewer("viewerContainer", {}); // 这只是一个示例，具体的viewer传入项目的viewer即可
const drawRef = ref();
function showData() {
    console.warn(drawRef.value.drawStore);
}
</script>

<template>
    <div id="viewerContainer" class="cesium-full-screen" />

    <ElButton type="primary" size="large" class="absolute z-100 top-10 left-10" @click="showData"> 点击查看数据 </ElButton>
    <DrawModel v-if="show" ref="drawRef" :viewer="viewer" class="absolute cesium-draw-model" />
</template>

<style lang="less" scoped>
.cesium-draw-model {
    right: 0;
    top: 40px;
}
</style>
```

### 直接使用方法触发绘制

```vue
<script setup lang="ts">
import { DrawFunc, MouseTooltip } from "cesium-draw-ts";

const drawGraph = ref();
drawGraph.value = new DrawFunc.DrawGraphLine(viewer.value, {});
drawGraph.value.startDraw();
</script>

<template>
    <MouseTooltip />
</template>
```

### 方法使用说明

#### 所有绘制方法

所有绘制方法

| 方法名,参数配置如下方 options | 方法描述 |
| ----------------------------- | -------- |
| DrawGraphPoint                | 点       |
| DrawGraphLine                 | 折线     |
| DrawGraphCircle               | 圆形     |
| DrawGraphPolygon              | 多边形   |
| DrawGraphRectangle            | 矩形     |
| DrawGraphBuffer               | 缓冲区   |
| DrawGraphStraightArrow        | 直线箭头 |
| DrawGraphAttactArrow          | 攻击箭头 |
| DrawGraphPincerArrow          | 钳击箭头 |

这些就是一些测量方法了，无配置

| 方法名                     | 方法描述 |
| -------------------------- | -------- |
| DrawGraphPosMeasure        | 坐标查询 |
| DrawGraphSpaceDisMeasure   | 空间距离 |
| DrawGraphStickDisMeasure   | 贴地距离 |
| DrawGraphAreaMeasure       | 面积量算 |
| DrawGraphAngleBtwMeasure   | 夹角角度 |
| DrawGraphAnglePitchMeasure | 俯仰角度 |

#### options 参数说明

| 参数名          | 类型    | 描述                                                                |
| --------------- | ------- | ------------------------------------------------------------------- |
| description     | string  | 描述                                                                |
| masthead        | boolean | 标头，是否展示绘制图形的 name                                       |
| lineType        | string  | 普通线条的线型                                                      |
| lineColor       | string  | 线条颜色                                                            |
| lineWidth       | number  | 线宽                                                                |
| radiusLineType  | string  | 半径线型                                                            |
| radiusLineColor | string  | 半径线条颜色                                                        |
| radiusLineWidth | number  | 半径线宽                                                            |
| outlineType     | string  | 外部边框线型                                                        |
| outlineColor    | string  | 外部边框颜色                                                        |
| outlineWidth    | number  | 边框线宽                                                            |
| fillColor       | string  | 填充颜色                                                            |
| radius          | number  | 缓冲区半径                                                          |
| fill            | boolean | 是否填充，UI 暂未添加这个选项                                       |
| outline         | boolean | 是否展示外部线条，UI 暂未添加这个选项                               |
| line            | boolean | 是否展示线条，UI 暂未添加这个选项                                   |
| layerId         | string  | 用作识别绘制的 entity 的标识，其实可以设置并使用 entity.id 做识别的 |
| dragIconLight   | string  | 绘制时的红点,默认边界点                                             |
| dragIcon        | string  | 绘制时的灰点,默认线条中心点                                         |
| dragIconGreen   | string  | 绘制时的绿点                                                        |

#### 绘制方法的内部执行方法

|               | 描述                                           |
| ------------- | ---------------------------------------------- |
| startDraw     | 开始绘制                                       |
| reEnterModify | 重新进入编辑                                   |
| drawOldData   | 取消修改,绘制修改前数据并清除所有监听          |
| updateConfig  | 更新绘制的图形配置，配置参数参考上面的参数说明 |
| clearDrawing  | 清除绘制数据并清除所有监听                     |
| saveDraw      | 保存绘制的图形,返回保存的数据并清除所有监听    |
| saveClear     | 保存时清除监听和锚点并返回位置数据信息         |
| clearHandler  | 清除所有 handler 监听                          |
| clear         | 清除所有绘制相关                               |

只有三个方法需要传入参数，使用如下：

```ts
reEnterModify(stagingData: DrawStagingData)
drawOldData(stagingData: DrawStagingData)
updateConfig(config: DrawConfigIF)
```

```ts
// 绘制属性面板可配置属性
export interface DrawConfigIF {
    name: string; // 名称
    description: string; // 描述
    masthead: boolean; // 标头，是否展示绘制图形的name

    lineType: string; // 线型
    lineWidth: number; // 线宽
    lineColor: string; // 线条颜色,rgba形式

    outlineType: string; // 边框线型
    outlineColor: string; // 边框颜色
    outlineWidth: number; // 边框线宽

    radiusLineType: string; // 半径线型
    radiusLineColor: string; // 半径线条颜色
    radiusLineWidth: number; // 半径线宽

    fillColor: string; // 填充颜色,rgba形式

    fill: boolean;
    outline: boolean;
    extrudedHeight: number;
    radius: number;
    line: boolean;
}

export interface SaveDataIF {
    timeStampId?: number;
    custom?: Array<number[]>;
    radius?: number;
    positions: Array<DrawCartesian3>;
    locations?: Array<number[]>;
}

// 暂存的绘制数据
export interface DrawStagingData {
    saveData: SaveDataIF;
    config?: DrawConfigIF;
}
```

### 进入编辑和删除

编辑和删除通过暴露的方法就可以实现，根据个人情况开发，可以参考下面的写法

```ts
/**
 * let layerId = 'xxx' //你自己设定的layerId
 * let viewer = new Viewer() // viewer 是你的 cesium 上的 viewer 应用
 * let drawGraph = new DrawGraphLine(viewer,{})  // drawGraph 是你的绘制 class
 */
// 给绘制的图形绑定点击事件
function bindGloveEvent() {
    handler = new ScreenSpaceEventHandler(viewer.value?.scene.canvas);
    handler.setInputAction((movement: any) => {
        const pick = viewer.value?.scene.pick(movement.position);
        if (defined(pick)) {
            const obj = pick?.id;
            if (!obj || !obj.layerId || flag.value === OPERATE_STATUS.NONE) return;
            if (flag.value === OPERATE_STATUS.EDIT) enterDrawEditing(obj.timeStampId, obj.drawType);
            else if (flag.value === OPERATE_STATUS.DELETE) clearEntityById(obj.timeStampId, true);
        }
    }, ScreenSpaceEventType.LEFT_CLICK);
}
function clearEntityById(timeStampId: number, clearDrawedShape = false) {
    const entityList = viewer.value?.entities.values;
    if (!entityList || entityList.length < 1) return;

    for (let i = 0; i < entityList.length; i++) {
        const entity: DrawEntity = entityList[i];
        if (entity.layerId === drawConfig.layerId && entity.timeStampId === timeStampId) {
            viewer.value?.entities.remove(entity);
            i--;
        }
    }
    if (clearDrawedShape) delete drawedShape.value[timeStampId];
}
function enterDrawEditing(timeStampId: number, drawType: string) {
    // 先移除entity
    clearEntityById(timeStampId);
    drawGraph.value?.reEnterModify(drawedShape.value[timeStampId]);
}
```

### 参考实现页面

[我写了一个 Vue 项目，可以参考内部的引用和实现方式](https://github.com/canbaoSama/cesium-draw-ts/tree/main/src/components)
