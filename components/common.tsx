
import React, { useState } from 'react';
import { ChevronRightIcon } from './icons';

// Input component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}
export const Input: React.FC<InputProps> = ({ label, ...props }) => {
  const baseClasses = "w-full p-2 border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors";
  const inputElement = <input {...props} className={`${baseClasses} ${props.className || ''}`} />;

  if (label) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <div className="mt-1">{inputElement}</div>
      </div>
    );
  }

  return inputElement;
};

// TextArea component
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
export const TextArea: React.FC<TextAreaProps> = (props) => {
    const baseClasses = "w-full p-2 border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors";
    return <textarea {...props} className={`${baseClasses} ${props.className || ''}`} />;
};

// Select component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
}
export const Select: React.FC<SelectProps> = ({ label, ...props }) => {
  const baseClasses = "w-full p-2 border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700";
  const selectElement = <select {...props} className={`${baseClasses} ${props.className || ''}`}>{props.children}</select>;

  if (label) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <div className="mt-1">{selectElement}</div>
      </div>
    );
  }

  return selectElement;
};

// Button component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  icon?: React.ElementType;
}
export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', children, icon: Icon, ...props }) => {
  const baseClasses = "flex items-center justify-center font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizeClasses = {
    lg: 'px-6 py-3 text-base gap-3',
    md: 'px-4 py-2 text-sm gap-2',
    sm: 'p-2 text-sm'
  };
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800',
    secondary: 'bg-white dark:bg-gray-700 text-stone-700 dark:text-stone-200 border border-stone-300 dark:border-gray-600 hover:bg-stone-50 dark:hover:bg-gray-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400'
  };

  const iconOnlyClass = !children ? `p-2` : '';
  const finalSizeClass = !children ? iconOnlyClass : sizeClasses[size];

  return (
    <button {...props} className={`${baseClasses} ${variantClasses[variant]} ${finalSizeClass} ${props.className || ''}`}>
      {Icon && <Icon className={children ? "w-5 h-5" : "w-4 h-4"} />}
      {children}
    </button>
  );
};

export const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
    if (!status) {
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">-</span>;
    }
    const lowerStatus = status.toLowerCase();
    let colorClasses = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'; // Default
    if (lowerStatus.includes('won') || lowerStatus.includes('complete')) {
        colorClasses = 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    } else if (lowerStatus.includes('lost')) {
        colorClasses = 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
    } else if (lowerStatus.includes('follow up')) {
        colorClasses = 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
    } else if (lowerStatus.includes('quoted') || lowerStatus.includes('booked')) {
        colorClasses = 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    } else if (lowerStatus.includes('survey')) {
        colorClasses = 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
    } else if (lowerStatus.includes('production')) {
        colorClasses = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300';
    } else if (lowerStatus.includes('hold')) {
        colorClasses = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    }

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>
            {status}
        </span>
    );
};

export const SidebarSection: React.FC<{
    title?: string;
    children: React.ReactNode;
    isHighlighted?: boolean;
}> = ({ title, children, isHighlighted = false }) => {
    const highlightClass = isHighlighted ? 'bg-blue-50 dark:bg-blue-900/30' : '';

    return (
    <div className={`border-b border-stone-200 dark:border-gray-600 pb-4 mb-4 ${highlightClass} -mx-2 px-2 rounded-lg transition-colors duration-200`}>
        {title && (
             <div className="w-full flex justify-between items-center pt-2 mb-3 text-left">
                <h4 className="font-semibold text-stone-700 dark:text-stone-200">{title}</h4>
            </div>
        )}
        <div className="space-y-4">{children}</div>
    </div>
    );
};

export const Checkbox: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; }> = ({ label, checked, onChange, disabled }) => (
    <label className={`flex items-center gap-2 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
        <input
            type="checkbox"
            checked={checked}
            onChange={e => onChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{label}</span>
    </label>
);
