"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { debounce } from '../utils/performance';

// 表单字段类型
export type FieldType = 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea';

// 表单字段选项类型
export interface FieldOption {
  value: string;
  label: string;
}

// 表单字段配置类型
export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  validation?: RegExp;
  errorMessage?: string;
  options?: FieldOption[];
}

// 表单值类型
export interface FormValues {
  [key: string]: string;
}

// 表单错误类型
export interface FormErrors {
  [key: string]: string;
}

// 表单组件属性类型
interface OptimizedFormProps {
  fields: FormField[];
  onSubmit: (values: FormValues) => void;
  submitButtonText?: string;
  initialValues?: FormValues;
}

/**
 * 优化的表单组件
 * 使用React.memo、useCallback和useMemo优化性能
 */
const OptimizedForm: React.FC<OptimizedFormProps> = ({
  fields = [],
  onSubmit,
  submitButtonText = '提交',
  initialValues = {}
}) => {
  // 状态
  const [values, setValues] = useState<FormValues>(() => {
    // 初始化表单值
    const initialFormValues: FormValues = {};
    if (fields && Array.isArray(fields)) {
      fields.forEach(field => {
        initialFormValues[field.id] = initialValues[field.id] || '';
      });
    }
    return initialFormValues;
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 使用useMemo缓存验证函数，避免重复创建
  const validateField = useMemo(() => {
    return (field: FormField, value: string): string => {
      // 必填字段验证
      if (field.required && !value) {
        return field.errorMessage || `${field.label}不能为空`;
      }
      
      // 正则验证
      if (field.validation && value && !field.validation.test(value)) {
        return field.errorMessage || `${field.label}格式不正确`;
      }
      
      return '';
    };
  }, []);
  
  // 使用useMemo缓存表单验证函数
  const validateForm = useMemo(() => {
    return (formValues: FormValues): FormErrors => {
      const formErrors: FormErrors = {};
      
      if (fields && Array.isArray(fields)) {
        fields.forEach(field => {
          const error = validateField(field, formValues[field.id]);
          if (error) {
            formErrors[field.id] = error;
          }
        });
      }
      
      return formErrors;
    };
  }, [fields, validateField]);
  
  // 使用防抖优化验证，避免频繁验证
  const debouncedValidate = useCallback(
    debounce((fieldId: string, value: string) => {
      const field = fields.find(f => f.id === fieldId);
      if (field) {
        const error = validateField(field, value);
        setErrors(prev => ({
          ...prev,
          [fieldId]: error
        }));
      }
    }, 300),
    [fields, validateField]
  );
  
  // 使用useCallback优化处理函数，避免不必要的重新渲染
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 使用防抖验证
    debouncedValidate(name, value);
  }, [debouncedValidate]);
  
  // 使用useCallback优化处理函数
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // 立即验证，不使用防抖
    const field = fields.find(f => f.id === name);
    if (field) {
      const error = validateField(field, values[name]);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, [fields, validateField, values]);
  
  // 使用useCallback优化提交处理函数
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // 标记所有字段为已触摸
    const allTouched: Record<string, boolean> = {};
    if (fields && Array.isArray(fields)) {
      fields.forEach(field => {
        allTouched[field.id] = true;
      });
    }
    setTouched(allTouched);
    
    // 验证所有字段
    const formErrors = validateForm(values);
    setErrors(formErrors);
    
    // 如果没有错误，提交表单
    if (Object.keys(formErrors).length === 0) {
      setIsSubmitting(true);
      
      // 模拟异步提交
      setTimeout(() => {
        onSubmit(values);
        setIsSubmitting(false);
      }, 500);
    }
  }, [fields, validateForm, values, onSubmit]);
  
  // 使用useMemo缓存是否有错误的计算
  const hasErrors = useMemo(() => {
    return Object.keys(errors).length > 0;
  }, [errors]);
  
  // 使用React.memo优化的表单输入组件
  const FormInput = React.memo(({ field }: { field: FormField }) => {
    const error = touched[field.id] && errors[field.id];
    
    return (
      <div className="mb-4">
        <label 
          htmlFor={field.id} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {field.type === 'select' ? (
          <select
            id={field.id}
            name={field.id}
            value={values[field.id]}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full p-2 border rounded-md ${
              error ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">请选择</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : field.type === 'textarea' ? (
          <textarea
            id={field.id}
            name={field.id}
            value={values[field.id]}
            onChange={handleChange as any}
            onBlur={handleBlur as any}
            placeholder={field.placeholder}
            className={`w-full p-2 border rounded-md ${
              error ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            rows={4}
          />
        ) : (
          <input
            id={field.id}
            name={field.id}
            type={field.type}
            value={values[field.id]}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={field.placeholder}
            className={`w-full p-2 border rounded-md ${
              error ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        )}
        
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  });
  
  // 为组件添加displayName，便于调试
  FormInput.displayName = 'FormInput';
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(field => (
        <FormInput key={field.id} field={field} />
      ))}
      
      <div className="mt-6">
        <button
          type="submit"
          disabled={isSubmitting || hasErrors}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isSubmitting || hasErrors
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          } transition-colors`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              处理中...
            </span>
          ) : (
            submitButtonText
          )}
        </button>
      </div>
    </form>
  );
};

export default OptimizedForm; 