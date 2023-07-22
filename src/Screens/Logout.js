import React, {useContext, useEffect, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {UserContext} from '../../UserContext';
import RNSecureStorage, {ACCESSIBLE} from 'rn-secure-storage';
import {STORE_KEY, APP_URL, DEV_URL} from '@env';
import {TextInput} from 'react-native-gesture-handler';

const {width, height} = Dimensions.get('screen');

const Logout = () => {
  const nav = useNavigation();
  const [jwt, setJwt, handleStoreToken] = useContext(UserContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  return (
    <SafeAreaView style={styles.containerStyle}>
      <ActivityIndicator size="small" color="#0000ff" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  containerStyle: {
    height: height,
    alignItems: 'center',
    backgroundColor: 'white',
    gap: 20,
  },
  contentStyles: {
    flex: 1,
    alignItems: 'center',
    marginTop: 100,
    gap: 50,
  },
  headerTextStyles: {
    fontSize: 30,
    fontWeight: '500',
    color: 'black',
  },
  buttonTextStyles: {
    fontSize: 20,
    fontWeight: '500',
    color: 'white',
  },
  buttonStyles: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1bab05',
    width: width - 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputsStyles: {
    height: 400,
    backgroundColor: 'white',
    padding: 20,
    gap: 20,
    width: width - 40,
  },
  inputStyles: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomColor: 'gainsboro',
    borderBottomWidth: 1,
    fontSize: 20,
    backgroundColor: 'white',
    width: width - 40,
  },
  errorStyle: {
    color: 'red',
  },
});

export default Logout;
