import React, { useState, useRef, useEffect } from 'react';
import styles from './CustomSelect.module.css';

type Option = {
  value: string;
  label: string;
};

type CustomSelectProps = {
  name: string;
  value: string;
  options: Option[];
  placeholder: string;
  onChange: (name: string, value: string) => void;
};

export const CustomSelect = ({ name, value, options, placeholder, onChange }: CustomSelectProps) => {
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
    onChange(name, optionValue);
    setIsOpen(false); 
  };

  return (
    <div className={styles.wrapper} ref={selectRef}>
      <input type="hidden" name={name} value={value} required />

      <div 
        className={`${styles.trigger} ${isOpen ? styles.triggerActive : ''} ${!value ? styles.placeholder : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOption ? selectedOption.label : placeholder}
        
        <svg 
          className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`} 
          width="12" height="8" viewBox="0 0 12 8" fill="none"
        >
          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div className={`${styles.dropdown} ${isOpen ? styles.dropdownOpen : ''}`}>
        {options.map((option) => (
          <div
            key={option.value}
            className={`${styles.option} ${value === option.value ? styles.optionSelected : ''}`}
            onClick={() => handleSelect(option.value)}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
};