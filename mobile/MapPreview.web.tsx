import { createElement } from 'react';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native';

type MapPreviewProps = {
  latitude: number;
  longitude: number;
  label: string;
};

export default function MapPreview({ latitude, longitude, label }: MapPreviewProps) {
  const [zoom, setZoom] = useState(15);
  const span = 0.012 * Math.pow(2, 15 - zoom);
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - span}%2C${latitude - span}%2C${longitude + span}%2C${latitude + span}&layer=mapnik&marker=${latitude}%2C${longitude}`;

  return (
    <View style={styles.preview}>
      {createElement('iframe', {
        title: `Attendance location: ${label}`,
        src: mapUrl,
        style: iframeStyle,
        loading: 'lazy',
        allowFullScreen: true,
      })}
      <View style={styles.zoomControls}>
        <Pressable style={styles.zoomButton} onPress={() => setZoom((current) => Math.min(current + 1, 19))}><Text style={styles.zoomText}>+</Text></Pressable>
        <Pressable style={styles.zoomButton} onPress={() => setZoom((current) => Math.max(current - 1, 11))}><Text style={styles.zoomText}>-</Text></Pressable>
      </View>
      <View style={styles.caption}><Text style={styles.pin}>GPS</Text></View>
    </View>
  );
}

const iframeStyle = {
  border: 'none',
  height: '100%',
  width: '100%',
};

const styles = StyleSheet.create({
  preview: {
    height: 180,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#E8F1F5',
  },
  caption: { position: 'absolute', left: 10, right: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  zoomControls: { position: 'absolute', right: 10, top: 10, borderRadius: 8, overflow: 'hidden', elevation: 3 },
  zoomButton: { width: 34, height: 34, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#D6DCE4' },
  zoomText: { color: '#17233C', fontSize: 22, lineHeight: 25, fontWeight: '700' },
  pin: {
    color: '#FFFFFF',
    backgroundColor: '#159A82',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
  },
});
