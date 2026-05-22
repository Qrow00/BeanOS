import { useState } from 'react';
import { Image, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore, lightTheme, darkTheme } from '../../store/themeStore';
import { useSettingsStore } from '../../store/settingsStore';

interface LogoProps {
  size?: number | string;
  onPress?: () => void;
  editable?: boolean;
  previewMode?: 'light' | 'dark';
}

const SIZE_MAP: Record<string, number> = {
  small: 40,
  medium: 64,
  large: 100,
  xlarge: 128,
};

export default function Logo({ size = 100, onPress, editable, previewMode }: LogoProps) {
  const { colors: themeColors, mode } = useThemeStore();
  const { brandLogoUri, saveBrandLogo } = useSettingsStore();
  const [localUri, setLocalUri] = useState<string | null>(null);
  const pixelSize = typeof size === 'string' ? (SIZE_MAP[size] || 100) : size;

  const displayUri = localUri || brandLogoUri;
  const isDark = previewMode ? previewMode === 'dark' : mode === 'dark';
  const colors = previewMode ? (isDark ? darkTheme : lightTheme) : themeColors;

  const handlePick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Camera roll access is needed to change the brand logo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setLocalUri(uri);
      await saveBrandLogo(uri);
    }
  };

  const Wrapper = editable || onPress ? TouchableOpacity : View;

  return (
    <Wrapper onPress={editable ? handlePick : onPress} activeOpacity={0.7}>
      {displayUri ? (
        <Image
          source={{ uri: displayUri }}
          style={[styles.image, { width: pixelSize, height: pixelSize, borderColor: colors.border }]}
          resizeMode="contain"
        />
      ) : (
        <View style={[
          styles.placeholder,
          {
            width: pixelSize,
            height: pixelSize,
            borderColor: isDark ? '#555' : '#2563EB',
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          },
        ]}>
          <Text style={[styles.icon, { fontSize: pixelSize * 0.45 }]}>
            {isDark ? '🖼️' : '🏪'}
          </Text>
          <Text style={[styles.label, { color: '#888', fontSize: pixelSize * 0.11 }]}>
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </Text>
        </View>
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: 16,
    borderWidth: 1,
  },
  placeholder: {
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    lineHeight: undefined,
  },
  label: {
    fontWeight: '600',
    marginTop: 2,
  },
});
