import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Banner as PaperBanner, Text } from 'react-native-paper';
import { useBanner } from '../contexts/BannerContext';

const bannerColors = {
  info: { bg: '#e3f2fd', icon: '#1976d2' },
  success: { bg: '#e8f5e9', icon: '#388e3c' },
  warning: { bg: '#fff3e0', icon: '#f57c00' },
};

export function BannerDisplay() {
  const { banners, dismissBanner } = useBanner();

  if (banners.length === 0) return null;

  return (
    <View style={styles.container}>
      {banners.map((banner) => (
        <PaperBanner
          key={banner.id}
          visible={true}
          actions={[
            {
              label: 'Dismiss',
              onPress: () => dismissBanner(banner.id),
            },
          ]}
          icon={banner.type === 'success' ? 'check-circle' : banner.type === 'warning' ? 'alert' : 'bell'}
          style={[styles.banner, { backgroundColor: bannerColors[banner.type].bg }]}
        >
          <Text style={styles.title}>{banner.title}</Text>
          {'\n'}
          <Text style={styles.message}>{banner.message}</Text>
        </PaperBanner>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  banner: {
    marginBottom: 4,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  message: {
    fontSize: 13,
  },
});
