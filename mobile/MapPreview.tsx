import { StyleSheet, Text, View } from 'react-native';

type MapPreviewProps = {
  latitude: number;
  longitude: number;
  label: string;
};

export default function MapPreview({ latitude, longitude, label }: MapPreviewProps) {
  return (
    <View style={styles.preview}>
      <Text style={styles.pin}>GPS</Text>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.coordinates}>{latitude.toFixed(5)}, {longitude.toFixed(5)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { height: 180, width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F1F5' },
  pin: { color: '#FFFFFF', backgroundColor: '#159A82', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7, fontSize: 11, fontWeight: '800', overflow: 'hidden' },
  label: { color: '#17233C', fontSize: 13, fontWeight: '700', marginTop: 9 },
  coordinates: { color: '#6B7891', fontSize: 11, marginTop: 3 },
});