import React, {useState, useEffect, useContext} from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import {TextInput, TouchableOpacity} from 'react-native-gesture-handler';
import {UserContext} from '../../UserContext';
import {STORE_KEY, APP_URL} from '@env';
import {useNavigation} from '@react-navigation/native';
import {v4 as uuid} from 'uuid';

const {width, height} = Dimensions.get('screen');

const Settings = () => {
  const [jwt, setJwt, handleStoreToken, handleFetchToken] =
    useContext(UserContext);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const nav = useNavigation();

  useEffect(() => {
    fetch(`${APP_URL}/api/v1/users/details`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: jwt,
        'User-Agent': 'any-name',
      },
      mode: 'cors',
    })
      .then(res => res.json())
      .then(async data => {
        if (data.status === 200) {
          setFirstName(data.user.firstName);
          setLastName(data.user.lastName);
        }
      })
      .catch(error => {
        console.log('error fetching settings:', error);
        nav.navigate('Login');
      });
  }, [jwt]);

  const handleUpdateProfile = () => {
    fetch(`${APP_URL}/api/v1/auth/update`, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: jwt,
        'User-Agent': 'any-name',
      },
      mode: 'cors',
      body: JSON.stringify({
        firstName: firstName,
        lastName: lastName,
        password: password,
      }),
    })
      .then(res => res.json())
      .then(async data => {
        if (data.status === 204) {
          console.log(data);
          nav.navigate('Routes', {update: uuid()});
        } else {
          setError(data.body.message[0]);
          console.log('Unable to update profile: ', data);
          //alert user that their login attempt was not successful
        }
        //set context here (might not have to set context here cuz context is derived from store)
        //store token here
      })
      .catch(error => {
        console.log('error updating profile:', error);
      });
  };

  return (
    <View style={styles.containerStyle}>
      <Text style={styles.headerTextStyles}>Settings</Text>
      <View style={styles.inputsStyles}>
        <TextInput
          placeholder="First name"
          style={styles.inputStyles}
          value={firstName}
          onChangeText={e => setFirstName(e.valueOf())}
        />
        <TextInput
          placeholder="Last name"
          style={styles.inputStyles}
          value={lastName}
          onChangeText={e => setLastName(e.valueOf())}
        />
        <TextInput
          placeholder="Password"
          style={styles.inputStyles}
          secureTextEntry={true}
          value={password}
          onChangeText={e => setPassword(e.valueOf())}
        />
      </View>
      <View style={{gap: 10}}>
        <TouchableOpacity
          style={styles.buttonStyles}
          onPress={handleUpdateProfile}>
          <Text style={styles.buttonTextStyles}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{...styles.buttonStyles, backgroundColor: 'black'}}
          onPress={() => {
            setFirstName('');
            setLastName('');
            setPassword('');
            setError('');
          }}>
          <Text style={styles.buttonTextStyles}>Reset</Text>
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.errorStyle}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  containerStyle: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    gap: 50,
    padding: 20,
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
    backgroundColor: 'white',
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
  },
  subscriber: {
    fontSize: 20,
    padding: 10,
    flexDirection: 'row',
    alignContent: 'center',
    justifyContent: 'space-between',
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  errorStyle: {
    color: 'red',
  },
});

export default Settings;
