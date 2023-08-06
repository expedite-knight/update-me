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
import {
  PERMISSIONS,
  request,
  check,
  openSettings,
} from 'react-native-permissions';
import Contacts from 'react-native-contacts';
import RNSecureStorage, {ACCESSIBLE} from 'rn-secure-storage';
import EncryptedStorage from 'react-native-encrypted-storage';

const {width, height} = Dimensions.get('screen');

const Login = ({navigation}) => {
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
          await handleStoreToken(data.body.jwtToken);
          setJwt(data.body.jwtToken);
          setError('');
          handleFetchAndStoreContacts();
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

  function handleFetchAndStoreContacts() {
    if (Platform.OS === 'ios') {
      request(PERMISSIONS.IOS.CONTACTS).then(result => {
        if (result === 'granted') {
          Contacts.getAll()
            .then(data => handleStoreContacts(data))
            .catch(err => {
              console.log('Unable to get contacts: ', err);
              setLoading(false);
            });
        }
      });
    } else {
      request(PERMISSIONS.ANDROID.READ_CONTACTS).then(result => {
        if (result === 'granted') {
          Contacts.getAll()
            .then(data => handleStoreContacts(data))
            .catch(err => {
              console.log('Unable to get contacts: ', err);
              setLoading(false);
            });
        }
      });
    }
  }

  function handleStoreContacts(contacts) {
    if (RNSecureStorage) {
      RNSecureStorage.set('contacts', JSON.stringify(contacts), {
        accessible: ACCESSIBLE.WHEN_UNLOCKED,
      }).then(
        res => {
          console.log('Stored contacts successfully');
          navigation.navigate('Routes');
        },
        err => {
          console.log('Err storing contacts: ', err);
        },
      );
    } else {
      try {
        EncryptedStorage.setItem('contacts', JSON.stringify(contacts));
        console.log('Stored contacts successfully');
        navigation.navigate('Routes');
      } catch (error) {
        console.log('Err Storing contacts: ', error);
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
                      style={styles.buttonStyles}
                      onPress={handleLogin}>
                      <Text style={styles.buttonTextStyles}>Login</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        ...styles.buttonStyles,
                        backgroundColor: 'black',
                        borderColor: 'black',
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
    borderColor: '#de3623',
    borderWidth: 1,
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
