import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

const MapAttribution = ({ style }: { style?: StyleProp<ViewStyle> }) => (
  <View style={[styles.container, style]}>
    <Text style={styles.text}>© CARTO, © OpenStreetMap contributors</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  text: {
    color: '#334155',
    fontSize: 10,
  },
});

export default MapAttribution;
