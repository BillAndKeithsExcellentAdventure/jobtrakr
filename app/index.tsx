import { ActivityIndicator, View } from 'react-native';

const IndexPage = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <ActivityIndicator size='large' color='#0000ff' />
    </View>
  );
};

export default IndexPage;
