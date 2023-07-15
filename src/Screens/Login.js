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
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {UserContext} from '../../UserContext';
import RNSecureStorage, {ACCESSIBLE} from 'rn-secure-storage';
import {STORE_KEY, APP_URL} from '@env';
import {TextInput} from 'react-native-gesture-handler';

const {width, height} = Dimensions.get('screen');

const Login = () => {
  const nav = useNavigation();
  const [jwt, setJwt, handleStoreToken] = useContext(UserContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleLogin() {
    fetch(`${APP_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    })
      .then(res => res.json())
      .then(async data => {
        if (data.status === 200) {
          await handleStoreToken(data.body.jwtToken);
          setJwt(data.body.jwtToken);
          setError('');
          nav.push('Routes');
        } else {
          setError('Incorrect email or password');
          console.log('Incorrect email or password');
          //alert user that their login attempt was not successful
        }
        //set context here (might not have to set context here cuz context is derived from store)
        //store token here
      })
      .catch(error => {
        console.log('error logging in:', error[0]);
      });
  }

  return (
    <SafeAreaView style={styles.containerStyle}>
      <Text style={styles.headerTextStyles}>UpdateMe</Text>
      <View style={styles.contentStyles}>
        {/* <TouchableOpacity style={styles.buttonStyles}>
          <Text
            style={styles.buttonTextStyles}
            onPress={() => nav.navigate('Home')}>
            To Home
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonStyles}>
          <Text
            style={styles.buttonTextStyles}
            onPress={() => nav.navigate('Routes')}>
            To Routes
          </Text>
        </TouchableOpacity> */}
        <View style={{gap: 20}}>
          <TextInput
            value={email}
            placeholder="Email"
            style={styles.inputStyles}
            onChangeText={e => setEmail(e.valueOf())}
          />
          <TextInput
            secureTextEntry={true}
            value={password}
            placeholder="Password"
            style={styles.inputStyles}
            onChangeText={e => setPassword(e.valueOf())}
          />
        </View>
        <View style={{gap: 20}}>
          <TouchableOpacity style={styles.buttonStyles} onPress={handleLogin}>
            <Text style={styles.buttonTextStyles}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{...styles.buttonStyles, backgroundColor: 'black'}}
            onPress={() => nav.navigate('Signup')}>
            <Text style={styles.buttonTextStyles}>Sign up</Text>
          </TouchableOpacity>
        </View>
        {error.trim() !== '' && <Text style={styles.errorStyle}>{error}</Text>}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  containerStyle: {
    flex: 1,
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
    width: width - 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputsStyles: {
    height: 400,
    backgroundColor: 'white',
    padding: 20,
    gap: 20,
    width: width - 100,
  },
  inputStyles: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomColor: 'gray',
    borderBottomWidth: 2,
    fontSize: 20,
    backgroundColor: 'white',
    width: width - 100,
  },
  errorStyle: {
    color: 'red',
  },
});

export default Login;
