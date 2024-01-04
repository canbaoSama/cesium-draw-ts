<script setup lang="ts">
import { inject, reactive, ref } from 'vue'

import { PARAMS_INC_SHAPE } from '@/utils/cesium/drawGraph/config'
import LineSelect from '@/components/LineSelect.vue'
import { ELEMENT_COMPONENTS_CONFIG } from '@/config'
import { OPERATE_STATUS } from '@/constants'

const { attrForm, flag, drawingType } = inject('drawStore')
const configFormRef = ref()
const rules = reactive({
    name: [
        { required: true, message: '请输入当前绘制图形名称', trigger: 'blur' },
    ],
    description: [
        { required: true, message: '请输入当前绘制图形描述', trigger: 'blur' },
    ],
})

async function validateForm() {
    await configFormRef.value.validate()
}

defineExpose({ validateForm })
</script>

<template>
    <ElForm ref="configFormRef" :model="attrForm" :rules="rules" label-width="72px" :disabled="![OPERATE_STATUS.EDIT, OPERATE_STATUS.ADD].includes(flag)"
        class="draw-config-container mt-2 p-2 b-1-white-solid rounded-1">
        <ElFormItem label="名称" prop="name">
            <ElInput v-model.trim="attrForm.name" size="small" :maxlength="ELEMENT_COMPONENTS_CONFIG.NAME_MAX_LENGTH" show-word-limit placeholder="请输入名称" />
        </ElFormItem>
        <ElFormItem label="描述" prop="description">
            <ElInput v-model.trim="attrForm.description" size="small" :maxlength="ELEMENT_COMPONENTS_CONFIG.DES_MAX_LENGTH" type="textarea" show-word-limit placeholder="请输入描述" />
        </ElFormItem>
        <ElFormItem label="标头" prop="masthead" class="mb-2">
            <ElSwitch v-model="attrForm.masthead" size="small" />
        </ElFormItem>
        <div v-if="[OPERATE_STATUS.ADD, OPERATE_STATUS.EDIT].includes(flag)" class="w-full h-0 border-0 border-t-1 b-1-white-30-solid mb-2" />
        <ElFormItem v-if="[OPERATE_STATUS.ADD, OPERATE_STATUS.EDIT].includes(flag)" label="标绘风格" class="flex-wrap-el-form-item mb-2">
            <div class="w-[calc(100%-20px)] ml-3">
                <ElFormItem v-if="PARAMS_INC_SHAPE.LINE.includes(drawingType)" label="线颜色" prop="lineColor">
                    <ElColorPicker v-model="attrForm.lineColor" show-alpha :predefine="ELEMENT_COMPONENTS_CONFIG.PRE_DEFINE_COLORS" />
                </ElFormItem>
                <ElFormItem v-if="PARAMS_INC_SHAPE.LINE.includes(drawingType)" label="线宽" prop="lineWidth">
                    <ElInputNumber v-model="attrForm.lineWidth" :precision="0" :min="2" :max="100" size="small" class="append-input" />
                    <div class="absolute right-6.5 bottom-1.75 w-6.35 h-5 flex-center-center color-gray-2 z-100 bg-white">
                        px
                    </div>
                </ElFormItem>
                <ElFormItem v-if="PARAMS_INC_SHAPE.LINE.includes(drawingType)" label="线型" prop="lineType">
                    <LineSelect v-model="attrForm.lineType" />
                </ElFormItem>

                <ElFormItem v-if="PARAMS_INC_SHAPE.RADIUS_LINE.includes(drawingType)" label="半径颜色" prop="radiusLineColor">
                    <ElColorPicker v-model="attrForm.radiusLineColor" show-alpha :predefine="ELEMENT_COMPONENTS_CONFIG.PRE_DEFINE_COLORS" />
                </ElFormItem>
                <ElFormItem v-if="PARAMS_INC_SHAPE.RADIUS_LINE.includes(drawingType)" label="半径线宽" prop="radiusLineWidth">
                    <ElInputNumber v-model="attrForm.radiusLineWidth" :precision="0" :min="2" :max="100" size="small" class="append-input" />
                    <div class="absolute right-6.5 bottom-1.75 w-6.35 h-5 flex-center-center color-gray-2 z-100 bg-white">
                        px
                    </div>
                </ElFormItem>
                <ElFormItem v-if="PARAMS_INC_SHAPE.RADIUS_LINE.includes(drawingType)" label="半径线型" prop="radiusLineType">
                    <LineSelect v-model="attrForm.radiusLineType" />
                </ElFormItem>

                <ElFormItem v-if="PARAMS_INC_SHAPE.OUT_LINE.includes(drawingType)" label="边框颜色" prop="outlineColor">
                    <ElColorPicker v-model="attrForm.outlineColor" show-alpha :predefine="ELEMENT_COMPONENTS_CONFIG.PRE_DEFINE_COLORS" class="w-full" />
                </ElFormItem>
                <ElFormItem v-if="PARAMS_INC_SHAPE.OUT_LINE.includes(drawingType)" label="边框线宽" prop="outlineWidth">
                    <ElInputNumber v-model="attrForm.outlineWidth" :precision="0" :min="2" :max="100" size="small" class="append-input" />
                    <div class="absolute right-6.5 bottom-1.75 w-6.35 h-5 flex-center-center color-gray-2 z-100 bg-white">
                        px
                    </div>
                </ElFormItem>
                <ElFormItem v-if="PARAMS_INC_SHAPE.OUT_LINE.includes(drawingType)" label="边框线型" prop="outlineType">
                    <LineSelect v-model="attrForm.outlineType" />
                </ElFormItem>

                <ElFormItem v-if="PARAMS_INC_SHAPE.RADIUS.includes(drawingType)" label="缓冲区半径" prop="outlineWidth" label-width="84px">
                    <ElInputNumber v-model="attrForm.radius" :precision="0" :min="1" :max="99999" size="small" class="append-input" />
                    <div class="absolute right-6.5 bottom-1.5 w-6.35 h-5 flex-center-center color-gray-2 z-100 bg-white">
                        km
                    </div>
                </ElFormItem>

                <ElFormItem v-if="PARAMS_INC_SHAPE.FILL.includes(drawingType)" label="填充颜色" prop="fillColor">
                    <ElColorPicker v-model="attrForm.fillColor" show-alpha :predefine="ELEMENT_COMPONENTS_CONFIG.PRE_DEFINE_COLORS" />
                </ElFormItem>
            </div>
        </ElFormItem>
    </ElForm>
</template>

<style lang="less">
.draw-config-container {
    .flex-wrap-el-form-item {
        flex-wrap: wrap;

        &>.el-form-item__content {
            width: 100%;
            flex: none;

            .el-form-item__label {
                width: 84px !important;
            }

            .append-input .el-input__inner {
                margin-right: 26px;
            }

            .el-popover.el-popper {
                min-width: 80px;
            }
        }
    }

    .el-input-number--small {
        width: 100%;
    }
}
</style>
