import { useState, useRef, useEffect } from 'react';
import { IconChevronDown } from './icons';
import './Select.scss';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function Select({
  value,
  onChange,
  options,
  placeholder = '请选择',
  disabled = false,
  className = '',
  size = 'md'
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div 
      ref={selectRef}
      className={`select-container ${className} ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''} select-${size}`}
    >
      <button
        type="button"
        className="select-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className={`select-value ${!selectedOption ? 'placeholder' : ''}`}>
          {selectedOption?.label || placeholder}
        </span>
        <IconChevronDown size={14} className="select-icon" />
      </button>

      {isOpen && (
        <div className="select-content">
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              className={`select-item ${option.value === value ? 'selected' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
