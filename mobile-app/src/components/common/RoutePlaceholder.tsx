import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

type RoutePlaceholderProps = {
  title: string;
};

export default function RoutePlaceholder({ title }: RoutePlaceholderProps) {
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 8 }}>
        {title}
      </Text>
      <Text style={{ color: '#64748B', marginBottom: 20, textAlign: 'center' }}>
        This screen is not available yet.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        style={{ padding: 12 }}
      >
        <Text style={{ color: '#2563EB', fontWeight: '600' }}>Go back</Text>
      </Pressable>
    </View>
  );
}
