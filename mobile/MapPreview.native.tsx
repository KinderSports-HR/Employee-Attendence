import MapView, { Marker } from 'react-native-maps';

type MapPreviewProps = {
  latitude: number;
  longitude: number;
  label: string;
};

export default function MapPreview({ latitude, longitude, label }: MapPreviewProps) {
  const coordinate = { latitude, longitude };

  return (
    <MapView
      style={{ height: 180, width: '100%' }}
      initialRegion={{ ...coordinate, latitudeDelta: 0.008, longitudeDelta: 0.008 }}
      region={{ ...coordinate, latitudeDelta: 0.008, longitudeDelta: 0.008 }}
    >
      <Marker coordinate={coordinate} title="Attendance check-in" description={label} />
    </MapView>
  );
}
