import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import {UserContext} from '../../UserContext';
import {STORE_KEY, APP_URL, DEV_URL} from '@env';
import {v4 as uuid} from 'uuid';

const {width, height} = Dimensions.get('screen');

const Settings = ({navigation}) => {
  const [jwt, setJwt, handleStoreToken, handleFetchToken] =
    useContext(UserContext);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
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
          setLoading(false);
        } else {
          navigation.navigate('Login');
        }
      })
      .catch(error => {
        console.log('error fetching settings:', error);
        navigation.navigate('Login');
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
          navigation.navigate('Routes', {update: uuid()});
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

  const handleDeleteAccount = () => {
    fetch(`${APP_URL}/api/v1/auth/delete`, {
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
        if (data.status === 204) {
          console.log(data);
          navigation.navigate('Login', {update: uuid()});
        } else {
          setError(data.body.message[0]);
          console.log('Unable to delete account: ', data);
        }
      })
      .catch(error => {
        console.log('error deleting account:', error);
      });
  };

  return (
    <>
      {!loading ? (
        <ScrollView automaticallyAdjustKeyboardInsets={true}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={styles.containerStyle}>
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
                  placeholder="New password"
                  style={styles.inputStyles}
                  secureTextEntry={true}
                  value={password}
                  onChangeText={e => setPassword(e.valueOf())}
                />
              </View>
              <View style={{gap: 10, marginHorizontal: 20, marginTop: 50}}>
                <TouchableOpacity
                  style={styles.buttonStyles}
                  onPress={handleUpdateProfile}>
                  <Text style={styles.buttonTextStyles}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    ...styles.buttonStyles,
                    backgroundColor: 'black',
                    borderColor: 'black',
                  }}
                  onPress={handleDeleteAccount}>
                  <Text style={{...styles.buttonTextStyles, color: 'white'}}>
                    Delete account
                  </Text>
                </TouchableOpacity>
              </View>
              {error && <Text style={styles.errorStyle}>{error}</Text>}
            </SafeAreaView>
          </TouchableWithoutFeedback>
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
  contentStyles: {},
  headerTextStyles: {
    fontSize: 30,
    fontWeight: '500',
    color: 'black',
    textAlign: 'center',
    marginTop: 50,
  },
  buttonTextStyles: {
    fontSize: 20,
    fontWeight: '500',
    color: '#de3623',
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
    marginTop: 50,
    backgroundColor: 'white',
    marginHorizontal: 20,
    gap: 10,
  },
  inputStyles: {
    paddingVertical: 10,
    borderBottomColor: 'gainsboro',
    borderBottomWidth: 1,
    fontSize: 20,
    backgroundColor: 'white',
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
