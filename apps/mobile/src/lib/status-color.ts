import type { ViewStyle } from 'react-native';

export function statusColor(status: string): ViewStyle {
  switch (status) {
    case 'paid':
      return { backgroundColor: '#e6f4ea' };
    case 'completed':
      return { backgroundColor: '#d4edda' };
    case 'expired':
      return { backgroundColor: '#fce4e4' };
    default:
      return { backgroundColor: '#fff3cd' };
  }
}
