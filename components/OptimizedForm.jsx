import React, { useState, useEffect } from 'react';

const OptimizedForm = ({ 
  title = "表单",
  fields = [], 
  onSubmit, 
  submitText = "提交", 
  cancelText = "取消",
  onCancel,
  initialValues = {},
  isLoading = false
}) => {
  // 确保fields是一个数组
  const safeFields = Array.isArray(fields) ? fields : [];
  
  // 初始化表单状态
  const [formValues, setFormValues] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // 当initialValues或fields变化时，更新表单值
  useEffect(() => {
    if (!initialValues || typeof initialValues !== 'object') {
      return;
    }
    
    const newValues = { ...formValues };
    
    // 使用安全的字段数组
    safeFields.forEach(field => {
      const fieldName = field.name;
      if (fieldName in initialValues) {
        newValues[fieldName] = initialValues[fieldName];
      } else if (!(fieldName in newValues)) {
        // 只在值不存在时设置默认值
        newValues[fieldName] = field.defaultValue || '';
      }
    });
    
    setFormValues(newValues);
  }, [initialValues, safeFields]);
  
  // 表单字段变更处理
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // 根据字段类型处理值
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormValues(prev => ({
      ...prev,
      [name]: fieldValue
    }));
    
    // 标记为已触摸
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // 实时验证
    validateField(name, fieldValue);
  };
  
  // 字段验证
  const validateField = (name, value) => {
    const field = safeFields.find(f => f.name === name);
    
    if (!field || !field.validation) {
      return true;
    }
    
    let isValid = true;
    let errorMessage = '';
    
    // 执行验证逻辑
    if (field.validation.required && (!value || value === '')) {
      isValid = false;
      errorMessage = field.validation.requiredMessage || '此字段必填';
    } else if (field.validation.pattern && value && !new RegExp(field.validation.pattern).test(value)) {
      isValid = false;
      errorMessage = field.validation.patternMessage || '格式不正确';
    } else if (field.validation.minLength && value && value.length < field.validation.minLength) {
      isValid = false;
      errorMessage = field.validation.minLengthMessage || `最少需要 ${field.validation.minLength} 个字符`;
    } else if (field.validation.maxLength && value && value.length > field.validation.maxLength) {
      isValid = false;
      errorMessage = field.validation.maxLengthMessage || `最多允许 ${field.validation.maxLength} 个字符`;
    } else if (field.validation.min && Number(value) < field.validation.min) {
      isValid = false;
      errorMessage = field.validation.minMessage || `不能小于 ${field.validation.min}`;
    } else if (field.validation.max && Number(value) > field.validation.max) {
      isValid = false;
      errorMessage = field.validation.maxMessage || `不能大于 ${field.validation.max}`;
    } else if (field.validation.custom && typeof field.validation.custom === 'function') {
      const customResult = field.validation.custom(value, formValues);
      if (customResult !== true) {
        isValid = false;
        errorMessage = customResult || '验证失败';
      }
    }
    
    // 更新错误状态
    setErrors(prev => ({
      ...prev,
      [name]: isValid ? '' : errorMessage
    }));
    
    return isValid;
  };
  
  // 表单提交处理
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 标记所有字段为已触摸
    const newTouched = {};
    safeFields.forEach(field => {
      newTouched[field.name] = true;
    });
    setTouched(newTouched);
    
    // 验证所有字段
    let isFormValid = true;
    const newErrors = {};
    
    safeFields.forEach(field => {
      const isFieldValid = validateField(field.name, formValues[field.name]);
      if (!isFieldValid) {
        isFormValid = false;
        newErrors[field.name] = errors[field.name];
      }
    });
    
    // 如果表单有效，调用提交处理函数
    if (isFormValid && onSubmit) {
      onSubmit(formValues);
    }
  };
  
  // 取消处理
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };
  
  // 渲染表单字段
  const renderField = (field) => {
    const {
      name,
      label,
      type = 'text',
      placeholder = '',
      options = [],
      disabled = false,
      description,
      className = '',
      labelClassName = ''
    } = field;
    
    const value = formValues[name] !== undefined ? formValues[name] : '';
    const hasError = touched[name] && errors[name];
    
    const commonProps = {
      id: `field-${name}`,
      name,
      value,
      onChange: handleChange,
      disabled: disabled || isLoading,
      'aria-invalid': hasError ? 'true' : 'false',
      'aria-describedby': hasError ? `error-${name}` : description ? `desc-${name}` : undefined,
      className: `${hasError 
        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
      } block w-full rounded-md shadow-sm sm:text-sm ${className}`
    };
    
    let fieldElement;
    
    switch (type) {
      case 'textarea':
        fieldElement = <textarea rows="4" placeholder={placeholder} {...commonProps} />;
        break;
        
      case 'select':
        fieldElement = (
          <select {...commonProps}>
            <option value="">{placeholder || '请选择'}</option>
            {options.map((option, idx) => (
              <option key={idx} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        break;
        
      case 'checkbox':
        fieldElement = (
          <input 
            type="checkbox" 
            checked={!!value} 
            className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${className}`}
            {...commonProps} 
          />
        );
        break;
        
      case 'radio':
        fieldElement = (
          <div className="space-y-2">
            {options.map((option, idx) => (
              <div key={idx} className="flex items-center">
                <input
                  id={`${name}-${idx}`}
                  name={name}
                  type="radio"
                  value={option.value}
                  checked={value === option.value}
                  onChange={handleChange}
                  disabled={disabled || isLoading}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor={`${name}-${idx}`} className="ml-3 block text-sm font-medium text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );
        break;
        
      default:
        fieldElement = <input type={type} placeholder={placeholder} {...commonProps} />;
        break;
    }
    
    return (
      <div key={name} className="mb-4">
        {type !== 'checkbox' && (
          <label htmlFor={`field-${name}`} className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}>
            {label}
            {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {type === 'checkbox' ? (
          <div className="flex items-center">
            {fieldElement}
            <label htmlFor={`field-${name}`} className={`ml-2 block text-sm text-gray-700 ${labelClassName}`}>
              {label}
              {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        ) : (
          fieldElement
        )}
        
        {description && !hasError && (
          <p id={`desc-${name}`} className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        )}
        
        {hasError && (
          <p id={`error-${name}`} className="mt-1 text-sm text-red-600">
            {errors[name]}
          </p>
        )}
      </div>
    );
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
      {title && <h2 className="text-xl font-bold mb-6">{title}</h2>}
      
      <form onSubmit={handleSubmit} noValidate>
        {safeFields.map(renderField)}
        
        <div className="flex justify-end space-x-2 mt-6">
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {cancelText}
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
          >
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {submitText}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OptimizedForm; 