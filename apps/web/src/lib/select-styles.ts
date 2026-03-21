import type { StylesConfig } from 'react-select';

export function darkSelectStyles<
  Option = { label: string; value: string },
  IsMulti extends boolean = true,
>(): StylesConfig<Option, IsMulti> {
  return {
    control: (base, state) => ({
      ...base,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderColor: state.isFocused ? 'var(--color-gallery-accent)' : 'rgba(255, 255, 255, 0.1)',
      borderRadius: '0.375rem',
      minHeight: '2.25rem',
      boxShadow: 'none',
      '&:hover': {
        borderColor: 'rgba(255, 255, 255, 0.2)',
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: '#1a1a1a',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '0.375rem',
      zIndex: 50,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '0.875rem',
      '&:active': {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
      },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '0.25rem',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#fff',
      fontSize: '0.75rem',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: 'rgba(255, 255, 255, 0.5)',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        color: '#fff',
      },
    }),
    input: (base) => ({
      ...base,
      color: '#fff',
      fontSize: '0.875rem',
    }),
    placeholder: (base) => ({
      ...base,
      color: 'rgba(255, 255, 255, 0.4)',
      fontSize: '0.875rem',
    }),
    singleValue: (base) => ({
      ...base,
      color: '#fff',
    }),
    noOptionsMessage: (base) => ({
      ...base,
      color: 'rgba(255, 255, 255, 0.4)',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: 'rgba(255, 255, 255, 0.4)',
      '&:hover': {
        color: 'rgba(255, 255, 255, 0.6)',
      },
    }),
    clearIndicator: (base) => ({
      ...base,
      color: 'rgba(255, 255, 255, 0.4)',
      '&:hover': {
        color: '#fff',
      },
    }),
  };
}
