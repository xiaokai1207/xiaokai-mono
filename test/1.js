import {
  isFunction,
  uniq,
  isEmpty,
  toString,
  trim,
  isObject,
  isEqual,
  intersection,
} from 'lodash';
import Vue from 'vue';
import { richTextTrim } from '@tencent/andon-utils';
import { getURIParam } from './uri';

// 修复数字被判空
export function isFullEmpty(value) {
  return isEmpty(toString(value));
}

export const isEmptyOrBlank = value => isFullEmpty(value) || trim(value) === '' || /^<div>\s+<\/div>$/.test(value) || value === '0000-00-00 00:00:00';

const isTrue = key => key === true;
const isNotTrue = key => !isTrue(key);

// 过滤空值
export function filterEmpty(data) {
  const params = JSON.parse(JSON.stringify(data));
  // 移除空数组或空字符串参数
  Object.keys(params)
    // 值为空、数组长度为0、时间格式0000-00-00 00:00:00或富文本为空的字段设置默认值为undefined
    .filter(key => (isFullEmpty(params[key]) || params[key] === '0000-00-00 00:00:00' || isEmptyOrBlank(richTextTrim(''.concat(params[key])))))
    .forEach((key) => {
      params[key] = undefined;
      delete params[key];
    });
  return params;
}

// 过滤未改变的值
export const filterUnChange = (params, oldData) => {
  const data = JSON.parse(JSON.stringify(params));
  Object.keys(data)
    .filter(key => isEqual(oldData[key], data[key]))
    .forEach((key) => {
      data[key] = undefined;
      delete data[key];
    });
  return data;
};

// 移除不在配置文件中的数据
export function filterNotInConfigs(configs = [], params = {}) {
  const configKeys = configs.reduce(
    (propKeys, { prop, props }) => propKeys.concat(prop).concat(props),
    [],
  );
  Object.keys(params)
    .filter(key => !configKeys.includes(key))
    .forEach((key) => {
      // 需要修改原始params
      // eslint-disable-next-line no-param-reassign
      params[key] = undefined;
      // eslint-disable-next-line no-param-reassign
      delete params[key];
    });
  return params;
}

// 为对象内的属性进行Vue监听注册
export function register(configs, params) {
  // 为所有没有复合的props的字段注册监听
  configs
    .filter(({ props }) => !props)
    .forEach(({ prop }) => {
      params[prop] === undefined && Vue.set(params, prop, undefined);
    });
  // 注册复合props,并添加对应关系
  configs
    .filter(({ props }) => props)
    .forEach(({ props }) => {
      props.forEach((prop) => {
        params[prop] === undefined && Vue.set(params, prop, undefined);
      });
    });
}

// 读取路径参数或配置里的默认值到params对象
export function reset(configs, params) {
  configs.forEach(({ prop, props = [], defaultValue }) => {
    const keys = props.includes(prop) ? props : props.concat(prop);
    keys.forEach((prop, index) => {
      // 优先获取路径参数
      const uriValue = getURIParam(prop);
      // 复合条件时优先考虑uriValue再挨个赋值defaultValue
      // eslint-disable-next-line no-nested-ternary
      const value = !isFullEmpty(uriValue)
        ? uriValue
        : Array.isArray(defaultValue) && props.length > 0
          ? defaultValue[index]
          : defaultValue;
      // 忽略undefined和null的深拷贝
      Vue.set(
        params,
        prop,
        value === undefined ? undefined : JSON.parse(JSON.stringify(value)),
      );
    });
  });
}

export function validateRequired(configs, params) {
  return configs
    .filter(({ required }) => required)
    .filter(({ prop, props }) => {
      if (props) {
        return props.every(prop => isFullEmpty(params[prop]));
      }
      return isFullEmpty(params[prop]);
    })
    .map(({ label, requiredMessage }) => requiredMessage || `${label}必填`);
}

/**
 * 验证枚举选项是否为枚举内的合法值
 * 兼容单选，多选情况
 */
export function validateInEnums(configs, data) {
  return configs
    .filter(({ required }) => required)
    .filter(({ enums }) => Array.isArray(enums) && !isEmpty(enums))
    .filter(({ prop }) => !isFullEmpty(data[prop]))
    .filter(({ prop, enums }) => {
      const enumsIds = enums.map(({ id }) => id);
      const values = [].concat(data[prop]);
      return !isEqual(intersection(values, enumsIds), values);
    })
    .map(({ label }) => `请重新选择${label}`);
}

export function validateCustomize(configs, params, data) {
  return configs
    // 先判断是否存在验证方法
    .filter(({ validateMethod }) => isFunction(validateMethod))
    // 自定义校验方法时，return错误信息
    .map(({ prop, props, validateMethod }) => (
      props ? validateMethod.call(null, params, data) : validateMethod.call(null, params[prop], params, data)))
    .filter(result => isNotTrue(result));
}

export function validateRequiredKeys(configs, params) {
  return configs
    .filter(({ required }) => required)
    .filter(({ prop, props }) => {
      if (props) {
        return props.every(prop => isFullEmpty(params[prop]));
      }
      return isFullEmpty(params[prop]);
    })
    .map(({ prop }) => prop);
}

export function validateInEnumsKeys(configs, data) {
  return configs
    .filter(({ required }) => required)
    .filter(({ enums }) => Array.isArray(enums) && !isEmpty(enums))
    .filter(({ prop }) => !isFullEmpty(data[prop]))
    .filter(({ prop, enums }) => {
      const enumsIds = enums.map(({ id }) => id);
      const values = [].concat(data[prop]);
      return !isEqual(intersection(values, enumsIds), values);
    })
    .map(({ prop }) => prop);
}

export function validateCustomizeKeys(configs, params, data) {
  return configs
    // 先判断是否存在验证方法
    .filter(({ validateMethod }) => isFunction(validateMethod))
    // 自定义校验方法时，return错误信息
    .map(({ prop, props, validateMethod }) => {
      if (props) {
        return validateMethod.call(null, params, data) ? true : prop;
      } else { 
        return validateMethod.call(null, params[prop], params, data) ? true : prop;
      }
    })
    .filter(result => isNotTrue(result));
}

/**
 * 根据配置对params进行验证
 * 先对params进行空值清理，保证必填验证正确
 * 可以传入原始数据，用于对比的验证
 */
export function validate(configs, params, data) {
  const cleanParams = filterEmpty(params);
  // 自动提示信息
  const validateErrors = uniq([
    ...validateRequired(configs, cleanParams),
    ...validateInEnums(configs, cleanParams),
    ...validateCustomize(configs, cleanParams, data),
  ]);
  const validateErrorsKeys = uniq([
    ...validateRequiredKeys(configs, cleanParams),
    ...validateInEnumsKeys(configs, cleanParams),
    ...validateCustomizeKeys(configs, cleanParams, data),
  ]);
  return {
    status: validateErrors.length === 0,
    messages: validateErrors,
    keys: validateErrorsKeys,
  };
}

export function clone(params) {
  return isObject(params) ? JSON.parse(JSON.stringify(params)) : params;
}
