import React, { memo, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

interface ChipItem {
  label: string;
  value: string;
}

interface Props {
  items: ChipItem[];
  selected: string | undefined;
  onSelect: (value: string | undefined) => void;
}

function FilterChips({ items, selected, onSelect }: Props) {
  const sorted = useMemo(() => [...items].sort((a, b) => a.label.localeCompare(b.label)), [items]);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scroll}
    >
      <TouchableOpacity
        style={[styles.chip, !selected && styles.chipActive]}
        onPress={() => onSelect(undefined)}
      >
        <Text style={[styles.label, !selected && styles.labelActive]}>All</Text>
      </TouchableOpacity>
      {sorted.map((item) => (
        <TouchableOpacity
          key={item.value}
          style={[styles.chip, selected === item.value && styles.chipActive]}
          onPress={() => onSelect(selected === item.value ? undefined : item.value)}
        >
          <Text style={[styles.label, selected === item.value && styles.labelActive]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

export default memo(FilterChips);

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 44,
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: '#000',
  },
  label: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  labelActive: {
    color: '#fff',
  },
});
