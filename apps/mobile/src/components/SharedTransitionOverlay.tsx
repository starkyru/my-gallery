import React, { useEffect } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import FastImage from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedTransition } from '@/lib/shared-transition';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NAV_HEADER_HEIGHT = Platform.OS === 'ios' ? 44 : 56;
const MOVE_DURATION = 400;
const FADE_OUT_DURATION = 150;

const AnimatedFastImage = Animated.createAnimatedComponent(FastImage);

export default function SharedTransitionOverlay() {
  const active = useSharedTransition((s) => s.active);
  const sourceRect = useSharedTransition((s) => s.sourceRect);
  const imageUri = useSharedTransition((s) => s.imageUri);
  const aspectRatio = useSharedTransition((s) => s.aspectRatio);
  const finish = useSharedTransition((s) => s.finish);
  const insets = useSafeAreaInsets();

  const progress = useSharedValue(0);
  const overlayOpacity = useSharedValue(1);
  const srcX = useSharedValue(0);
  const srcY = useSharedValue(0);
  const srcW = useSharedValue(0);
  const srcH = useSharedValue(0);
  const dstY = useSharedValue(0);
  const dstH = useSharedValue(0);

  useEffect(() => {
    if (active && sourceRect) {
      srcX.value = sourceRect.x;
      srcY.value = sourceRect.y;
      srcW.value = sourceRect.width;
      srcH.value = sourceRect.height;
      dstY.value = insets.top + NAV_HEADER_HEIGHT;
      dstH.value = SCREEN_WIDTH * aspectRatio;

      overlayOpacity.value = 1;
      progress.value = 0;
      progress.value = withTiming(1, { duration: MOVE_DURATION, easing: Easing.out(Easing.cubic) });
      overlayOpacity.value = withDelay(
        MOVE_DURATION,
        withTiming(0, { duration: FADE_OUT_DURATION }, (finished) => {
          if (finished) runOnJS(finish)();
        }),
      );
    }
  }, [
    active,
    sourceRect,
    aspectRatio,
    insets.top,
    progress,
    overlayOpacity,
    srcX,
    srcY,
    srcW,
    srcH,
    dstY,
    dstH,
    finish,
  ]);

  const imageStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: interpolate(progress.value, [0, 1], [srcX.value, 0]),
    top: interpolate(progress.value, [0, 1], [srcY.value, dstY.value]),
    width: interpolate(progress.value, [0, 1], [srcW.value, SCREEN_WIDTH]),
    height: interpolate(progress.value, [0, 1], [srcH.value, dstH.value]),
    zIndex: 2,
    opacity: overlayOpacity.value,
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    ...StyleSheet.absoluteFill,
    backgroundColor: '#fff',
    opacity: interpolate(progress.value, [0, 0.4, 1], [0, 0.85, 1]) * overlayOpacity.value,
    zIndex: 1,
  }));

  if (!active || !sourceRect) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={backdropStyle} />
      <AnimatedFastImage
        style={imageStyle}
        source={{ uri: imageUri }}
        resizeMode={FastImage.resizeMode.cover}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    elevation: 9999,
  },
});
