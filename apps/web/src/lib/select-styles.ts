import type { StylesConfig } from 'react-select';

export function darkSelectStyles<
  Option = { label: string; value: string },
  IsMulti extends boolean = true,
>(): StylesConfig<Option, IsMulti> {
  return {
    control: (base, state) => ({
      ...base,
      backgroundColor: 'transparent',
      borderColor: state.isFocused ? 'var(--color-ot-ochre)' : 'var(--color-ot-line)',
      borderRadius: '0.375rem',
      minHeight: '2.25rem',
      boxShadow: 'none',
      '&:hover': {
        borderColor: 'var(--color-ot-ochre)',
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'var(--color-ot-paper)',
      border: '1px solid var(--color-ot-line)',
      borderRadius: '0.375rem',
      zIndex: 50,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? 'var(--color-ot-paper-2)' : 'transparent',
      color: 'var(--color-ot-ink)',
      cursor: 'pointer',
      fontSize: '0.875rem',
      '&:active': {
        backgroundColor: 'var(--color-ot-paper-3)',
      },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: 'var(--color-ot-paper-2)',
      borderRadius: '0.25rem',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: 'var(--color-ot-ink)',
      fontSize: '0.75rem',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: 'var(--color-ot-mute)',
      '&:hover': {
        backgroundColor: 'var(--color-ot-paper-3)',
        color: 'var(--color-ot-ink)',
      },
    }),
    input: (base) => ({
      ...base,
      color: 'var(--color-ot-ink)',
      fontSize: '0.875rem',
    }),
    placeholder: (base) => ({
      ...base,
      color: 'var(--color-ot-mute)',
      fontSize: '0.875rem',
    }),
    singleValue: (base) => ({
      ...base,
      color: 'var(--color-ot-ink)',
    }),
    noOptionsMessage: (base) => ({
      ...base,
      color: 'var(--color-ot-mute)',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: 'var(--color-ot-mute)',
      '&:hover': {
        color: 'var(--color-ot-ink-soft)',
      },
    }),
    clearIndicator: (base) => ({
      ...base,
      color: 'var(--color-ot-mute)',
      '&:hover': {
        color: 'var(--color-ot-ink)',
      },
    }),
  };
}
