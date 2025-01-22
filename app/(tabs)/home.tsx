import { FlatList, Pressable, StyleSheet } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { useSession } from '@/session/ctx';
import { router } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { FlashList } from '@shopify/flash-list';

const DATA = [
  { title: 'Lot 123' },
  { title: 'Lot XYZ' },
  { title: 'Bertram Farm' },
  { title: "Grayson's Pool" },
  { title: '456 Main Street' },
  { title: '619 Elm Street' },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Project List</Text>
      <View style={styles.separator} lightColor='#eee' darkColor='rgba(255,255,255,0.1)' />
      <View style={{ flex: 1, width: 400, justifyContent: 'center', alignItems: 'center' }}>
        <FlatList
          style={{marginLeft:60, flex: 1, width: 400 }}
          data={DATA}
          renderItem={({ item }) => <Text style={{ fontSize: 30 }}>{item.title}</Text>}
          keyExtractor={(item) => item.title}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
