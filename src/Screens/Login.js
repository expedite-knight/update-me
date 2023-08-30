import React, {useContext, useEffect, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {UserContext} from '../../UserContext';
import {STORE_KEY, APP_URL, DEV_URL} from '@env';
import {TextInput} from 'react-native-gesture-handler';
import RNSecureStorage, {ACCESSIBLE} from 'rn-secure-storage';
import EncryptedStorage from 'react-native-encrypted-storage';

const {width, height} = Dimensions.get('screen');

const Login = ({navigation, isAuthorized}) => {
  const [jwt, setJwt, handleStoreToken] = useContext(UserContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleLogin() {
    setLoading(true);
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
          await handleStoreToken(data.body.jwtToken, 'jwt');
          await handleStoreToken(data.body.refreshToken, 'refresh');
          setJwt(data.body.jwtToken);
          setError('');

          await handleStoreCredentials();

          navigation.navigate('Routes');
        } else {
          setError('Incorrect email or password');
          setLoading(false);
        }
      })
      .catch(error => {
        setLoading(false);
        console.log('error logging in:', error[0]);
        setError('Something went wrong, try again later.');
      });
  }

  useEffect(() => {
    if (isAuthorized && navigation) navigation.navigate('Routes');
    handleFetchCredentials();
  }, [isAuthorized, navigation]);

  async function handleFetchCredentials() {
    let storedCreds = '';

    if (RNSecureStorage) {
      RNSecureStorage.get('creds')
        .then(value => {
          if (value && value !== '') {
            const user = JSON.parse(value);
            setEmail(user.email);
            setPassword(user.password);
            storedCreds = value;
          }
        })
        .catch(err => {
          console.log('No current creds');
        });
    } else {
      try {
        const value = await EncryptedStorage.getItem('creds');
        if (value && value !== '') {
          const user = JSON.parse(value);
          setEmail(user.email);
          setPassword(user.password);
          storedCreds = value;
        }
      } catch (error) {
        console.log('No current creds');
      }
    }
    return storedCreds;
  }

  async function handleStoreCredentials() {
    if (RNSecureStorage) {
      RNSecureStorage.set('creds', JSON.stringify({email, password}), {
        accessible: ACCESSIBLE.WHEN_UNLOCKED,
      }).then(
        res => {
          console.log('Stored creds successfully');
        },
        err => {
          console.log('ERR Storing token: ', err);
        },
      );
    } else {
      try {
        await EncryptedStorage.setItem(
          'creds',
          JSON.stringify({email, password}),
        );
        console.log('Stored creds successfully');
      } catch (error) {
        console.log('ERR Storing token: ', error);
      }
    }
  }

  return (
    <>
      {!loading ? (
        <ScrollView automaticallyAdjustKeyboardInsets={true}>
          <SafeAreaView style={styles.containerStyle}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <>
                <View style={{alignItems: 'center'}}>
                  <Image
                    source={require('../Assets/EK_logo.png')}
                    style={{width: 300, height: 150}}
                  />
                </View>
                <View style={styles.contentStyles}>
                  <View style={styles.inputsStyles}>
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
                  <View style={styles.buttonsStyles}>
                    <TouchableOpacity
                      style={{
                        ...styles.buttonStyles,
                        backgroundColor: '#AFE1AF',
                      }}
                      onPress={handleLogin}>
                      <Text
                        style={{...styles.buttonTextStyles, color: '#03c04a'}}>
                        Login
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        ...styles.buttonStyles,
                        backgroundColor: 'black',
                      }}
                      onPress={() => navigation.push('Signup')}>
                      <Text
                        style={{...styles.buttonTextStyles, color: 'white'}}>
                        Sign up
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {error.trim() !== '' && (
                    <Text style={styles.errorStyle}>{error}</Text>
                  )}
                </View>
              </>
            </TouchableWithoutFeedback>
          </SafeAreaView>
        </ScrollView>
      ) : (
        <View style={styles.containerStyle}>
          <ActivityIndicator size="small" color="black" />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  containerStyle: {
    flex: 1,
  },
  contentStyles: {
    padding: 20,
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
    color: '#de3623',
  },
  buttonsStyles: {
    backgroundColor: 'white',
    gap: 10,
  },
  buttonStyles: {
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'pink',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputsStyles: {
    backgroundColor: 'white',
    gap: 20,
  },
  inputStyles: {
    borderBottomColor: 'gainsboro',
    borderBottomWidth: 1,
    fontSize: 20,
    padding: 10,
    backgroundColor: 'white',
  },
  errorStyle: {
    textAlign: 'center',
    color: 'red',
  },
});

export default Login;
