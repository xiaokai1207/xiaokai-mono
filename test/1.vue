<template>
  <div :class="{ 'template-form--inline': inline, clearfix: inline }">
    <template
      v-for="{
        prop,
        label,
        type,
        enums,
        props,
        required,
        editComponent,
        pickerOptions,
        valueFormat,
        isFull,
        disabled: _disabled,
        placeholder,
        filterable,
        inputClass,
        formClass,
        rows,
        maxlength,
        border,
        min,
        max,
        step,
        displayProp,
        formItemWidth,
        formLabelWidth,
        clearable,
        infoTips,
        append,
        chooserMax,
        defaultValue,
        isFilterResigned,
        ...arg
      } in hasPermissionConfigs"
    >
      <el-form
        v-if="!isLoading"
        :key="prop"
        :label-width="labelWidth"
        :label-position="labelPosition"
        :style="{ width: formItemWidth }"
        :class="[ formItemWidth && 'template-form--inline-block', formClass ].filter(Boolean)"
        :rules="rules"
        :model="params"
        ref="formRef"
        :validate-on-rule-change="false"
        @submit.native.prevent
      >
        <el-form-item :required="required && !isQuery" :label="label" :label-width="formLabelWidth" :prop="prop">
          <slot :name="prop">
            <component
              :is="editComponent"
              v-if="editComponent"
              :ref="prop"
              :type="type"
              :prop="prop"
              :props="props"
              :value="isFull ? params : (params[prop] || defaultValue)"
              :class="inputClass"
              :data="isFull ? params : params[prop]"
              :value-display="params[displayProp]"
              :enums="enums"
              :disabled="disabled || _disabled"
              :placeholder="placeholder"
              :required="required"
              :clearable="clearable"
              :is-full="isFull"
              v-bind="{
                ...$attrs,
                ...arg
              }"
              @input="handleInput(prop, $event, isFull)"
              @update:data="handleInput(prop, $event, isFull)"
            />
            <el-select
              v-else-if="
                (type === 'multiple-select' || type === 'select')
              "
              v-model="params[prop]"
              class="select"
              :class="inputClass"
              :multiple="type === 'multiple-select'"
              :multiple-limit="arg.multipleLimit"
              :collapse-tags="!arg.notCollapseTags"
              :disabled="disabled || _disabled"
              :placeholder="placeholder"
              :clearable="clearable"
              :filterable="filterable"
              @change="$emit('change', prop, params[prop])"
            >
              <el-option v-if="isQuery" value="" label="全部" />
              <el-option
                v-for="{ id, value } in enums"
                :key="id"
                :value="id"
                :label="value"
              />
            </el-select>
            <tooltip-select
              v-else-if="type === 'tooltip-select'"
              v-model="params[prop]"
              :enums="enums"
              :class="inputClass"
              :multiple="type === 'tooltip-multiple-select'"
              :multiple-limit="arg.multipleLimit"
              :collapse-tags="!arg.notCollapseTags"
              :disabled="disabled || _disabled"
              :placeholder="placeholder"
              :clearable="clearable"
              :filterable="filterable"
            />
            <el-checkbox-group
              v-else-if="type === 'checkbox'"
              v-model="params[prop]"
              :class="inputClass"
              :disabled="disabled || _disabled"
            >
              <el-checkbox
                v-for="{ id, value, disabled } in enums"
                :key="id"
                :label="id"
                :border="border"
                :disabled="disabled"
                >{{ value }}</el-checkbox
              >
            </el-checkbox-group>
            <el-radio-group
              v-else-if="type === 'radio'"
              v-model="params[prop]"
              :class="inputClass"
              :disabled="disabled || _disabled"
              :placeholder="placeholder"
            >
              <el-radio
                v-for="{ id, value } in enums"
                :key="id"
                :label="id"
                :border="border"
                >{{ value }}</el-radio
              >
            </el-radio-group>
            <user-chooser
              v-else-if="
                type === 'userchooser' || type === 'multiple-userchooser'
              "
              v-model="params[prop]"
              :class="inputClass"
              :disabled="disabled || _disabled"
              :placeholder="placeholder"
              :singleton="type === 'userchooser'"
              :max="chooserMax"
              :isFilterResigned="isFilterResigned"
              :collapse-tags="arg.collapseTags"
            />
            <user-chooser
                v-else-if="
                type === 'groupchooser' || type === 'multiple-groupchooser'
              "
                v-model="params[prop]"
                :class="inputClass"
                :disabled="disabled || _disabled"
                :placeholder="placeholder"
                :is-mail="true"
                :singleton="type === 'groupchooser'"
                :collapse-tags="arg.collapseTags"
            />
            <el-input
              v-else-if="type === 'textarea'"
              v-model="params[prop]"
              v-bind="arg"
              type="textarea"
              :rows="rows"
              :maxlength="maxlength"
              :class="inputClass"
              :placeholder="placeholder || `请输入${label}`"
              :disabled="disabled || _disabled"
            />
            <!-- safari浏览器下时间日期组件可能会出现初始化没有显现及无法选定的问题 -->
            <date-time-range-group
              v-else-if="type === 'datetimerangegroup'"
              :input-class="inputClass"
              :value="params[prop]"
              :disabled="disabled || _disabled"
              @input="handleDateTimeRangePick(prop, props, $event)"
            />
            <el-date-picker
              v-else-if="type === 'datetimerange'"
              :class="inputClass"
              :value="params[prop]"
              type="datetimerange"
              :default-time="['00:00:00', '23:59:59']"
              :range-separator="arg.rangeSeparator || '-'"
              :start-placeholder="arg.startPlaceholder || '开始时间'"
              :end-placeholder="arg.endPlaceholder || '结束时间'"
              :picker-options="pickerOptions"
              :disabled="disabled || _disabled"
              @input="handleDateTimeRangePick(prop, props, $event)"
            />
            <el-date-picker
              v-else-if="type === 'date'"
              v-model="params[prop]"
              :class="inputClass"
              :clearable="clearable"
              type="date"
              :picker-options="pickerOptions"
              :disabled="disabled || _disabled"
              :value-format="valueFormat"
              :placeholder="placeholder || '选择日期'"
            >
            </el-date-picker>
            <el-date-picker
              v-else-if="type === 'datetime'"
              v-model="params[prop]"
              :class="inputClass"
              type="datetime"
              :picker-options="pickerOptions"
              :disabled="disabled || _disabled"
              :value-format="valueFormat"
              :placeholder="placeholder || '选择日期时间'"
            >
            </el-date-picker>
            <el-input-number
              v-else-if="type === 'number'"
              v-model="params[prop]"
              v-bind="arg"
              :class="inputClass"
              :min="min"
              :max="max"
              :placeholder="placeholder || `请输入${label}`"
              :step="step || 1"
              :controls-position="arg.controlsPosition || 'right'"
              :disabled="disabled || _disabled"
            ></el-input-number>
            <el-input
              v-else
              v-model="params[prop]"
              :class="inputClass"
              :placeholder="placeholder || `请输入${label}`"
              :disabled="disabled || _disabled"
              :maxlength="maxlength"
              @change="$emit('change', prop, params[prop])"
              v-bind="{
                ...$attrs,
                ...arg
              }"
            />
            <el-tooltip
              v-if="infoTips"
              effect="dark"
              :content="infoTips"
            >
              <i class="el-icon-info"></i>
            </el-tooltip>
          </slot>
          <component
            v-if="append"
            :is="append" />
        </el-form-item>
      </el-form>
    </template>
    <el-form
      :label-width="labelWidth"
      :label-position="labelPosition"
      @submit.native.prevent
    >
      <slot></slot>
    </el-form>
  </div>
</template>

<script>
import { TooltipSelect } from '@tencent/andon-stable';
import UserChooser from 'src/libs/components/user-chooser';
import UserMixin from 'src/libs/mixins/user-permission';
import SectionLoadingMixin from 'src/libs/mixins/page-event/section-loading';
import DateTimeRangeGroup from 'src/libs/components/date-time-range-group';
import moment from 'moment';
import { isMobile } from 'src/libs/env/env';
import { isFunction } from 'lodash';
import { filterEmpty, register, reset } from 'src/libs/utils/params';
// import { validateWithMessage } from 'src/modules/utils/params';

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const DEFAULT_LABEL_WIDTH = isMobile ? '90px' : '120px';

export default {
  name: 'TemplateForm',
  components: {
    DateTimeRangeGroup,
    UserChooser,
    TooltipSelect,
  },
  mixins: [UserMixin, SectionLoadingMixin],
  inheritAttrs: false,
  props: {
    isQuery: {
      type: Boolean,
      default: false,
    },
    isFilterEmpty: {
      type: Boolean,
      default: true,
    },
    inline: {
      type: Boolean,
      default: false,
    },
    configs: {
      type: Array,
      default() {
        return [];
      },
    },
    params: {
      type: Object,
      default() {
        return {};
      },
    },
    data: {
      type: Object,
      default() {
        return {};
      },
    },
    labelWidth: {
      type: String,
      default: DEFAULT_LABEL_WIDTH,
    },
    labelPosition: {
      type: String,
      default: 'right',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      rules: {},
    };
  },
  computed: {
    hasPermissionConfigs() {
      return this.configs.filter(item => (
        !item.editPermission || this.hasPermission(item.editPermission)
      ));
    },
  },
  watch: {
    configs: {
      deep: true,
      immediate: true,
      handler() {
        this.registerRules();
      },
    },
    rules: {
      deep: true,
      immediate: true,
      handler() {
        console.log('this.rules', this.rules);
      },
    },
  },
  created() {
    // 确保数据处理正确后，再渲染组件，避免组件错误使用默认值
    this.loading();
    this.registerParams();
    this.$nextTick(() => {
      this.loaded();
    });
  },
  methods: {
    registerParams() {
      register(this.configs, this.params);
    },
    registerRules() {
      console.log('this.configs', this.configs);
      this.configs.forEach((config) => {
        if (config.required) {
          this.$set(this.rules, config.prop, [
            {
              required: true,
              message: `${config.label || '字段'}必填`,
              trigger: 'blur',
            },
          ]);
        };
      });
    },
    resetParams() {
      reset(this.configs, this.params);
      this.$emit('reset');
      // 动态组件重置
      const refs = this.$refs || {};
      Object.values(refs)
        .filter(ref => ref && ref[0] && isFunction(ref[0].reset))
        .forEach((ref) => {
          ref[0] && ref[0].reset();
        });
      return filterEmpty(this.params);
    },
    submit() {
      this.$emit('before-submit');
      console.log('this.$refs', this.$refs);
      console.log('this.$refs.formRef', this.$refs.formRef);
      this.$refs.formRef.forEach((ref) => {
        ref.validate((valid) => {
          console.log('valid', valid);
          if (!valid) {
            this.$nextTick(() => {
              this.scrollToFirstError();
            });
            throw new Error('参数错误');
          }
        });
      });
      this.$emit('submit');
      return this.isFilterEmpty ? filterEmpty(this.params) : this.params;
      // const refs = this.$refs || {};
      // Object.values(refs)
      //   .filter(ref => ref && ref[0] && isFunction(ref[0].submit))
      //   .forEach((ref) => {
      //     ref[0] && ref[0].submit();
      //   });
      // // 查询模式直接返回参数，表单模式需要验证信息
      // if (
      //   this.isQuery
      //   || validateWithMessage(this.configs, this.params, this.data)
      // ) {
      //   this.$emit('submit');
      //   return this.isFilterEmpty ? filterEmpty(this.params) : this.params;
      // }
    },
    scrollToFirstError() {
      const errorElement = this.$el.querySelector('.el-form-item__error');
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    handleDateTimeRangePick(timeKey, [startTimeKey, endTimeKey], range) {
      let [startTime, endTime] = range || [undefined, undefined];
      // 将date格式转为字符串
      startTime = startTime && moment(startTime).format(DATE_FORMAT);
      endTime = endTime && moment(endTime).format(DATE_FORMAT);
      this.$set(this.params, startTimeKey, startTime);
      this.$set(this.params, endTimeKey, endTime);
      this.$set(this.params, timeKey, [startTime, endTime]);
    },
    handleInput(prop, val, isFull) {
      console.log('=======handleInput', prop, val);
      // 多字段暂不支持自动input
      if (isFull) {
        this.$emit('change');
        this.$emit('select-change', prop, val);
        return;
      }
      const param = this.params[prop];
      if (Array.isArray(param)) {
        param.splice(0, param.length);
        param.splice(0, 0, ...val);
      } else {
        this.$set(this.params, prop, val);
      }
      this.$emit('change', prop, val);
    },
  },
};
</script>

<style scoped>
.template-form--inline{
  max-width: 100%;
  &> .el-form {
  float: left;
}
}
.template-form--inline-block {
  display: inline-block;
  vertical-align: top;
}
</style>
