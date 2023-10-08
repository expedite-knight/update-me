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
  Animated,
} from 'react-native';
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import {UserContext} from '../../UserContext';
import {STORE_KEY, APP_URL, DEV_URL} from '@env';
import {v4 as uuid} from 'uuid';
import Popup from '../Components/Popup';

const {width, height} = Dimensions.get('screen');

//refresh
const Settings = ({navigation}) => {
  const [errorPopupY, setErrorPopupY] = useState(
    new Animated.Value(-height * 2),
  );
  const [popupY, setPopupY] = useState(new Animated.Value(-height * 2));
  const [popupText, setPopupText] = useState('');
  const [popupBackground, setPopupBackground] = useState('#1e90ff');
  const [subtext, setSubtext] = useState('');
  const [jwt, setJwt, handleStoreToken, handleFetchToken] =
    useContext(UserContext);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [number, setNumber] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const openPopup = (text, background, subtext) => {
    setPopupText(text);
    setPopupBackground(background);
    setSubtext(subtext);

    Animated.timing(popupY, {
      duration: 300,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const closePopup = () => {
    Animated.timing(popupY, {
      duration: 300,
      toValue: -height,
      useNativeDriver: true,
    }).start();
  };

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
          setNumber(data.user.phoneNumber);
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
    setLoading(true);
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
        number: number,
      }),
    })
      .then(res => res.json())
      .then(async data => {
        setLoading(false);
        if (data.status === 204) {
          openPopup('Account updated successfully', '#1e90ff');
          setTimeout(() => {
            closePopup();
          }, 3000);
        } else {
          console.log('data: ', data);
          openPopup(`Unable to update account`, '#DC143C', data.body.error[0]);
          setTimeout(() => {
            closePopup(true);
          }, 3000);
          //alert user that their login attempt was not successful
        }
      })
      .catch(error => {
        console.log('error updating profile:', error);
        openPopup(`Unable to update account`, '#DC143C', error[0]);
        setTimeout(() => {
          closePopup(true);
        }, 3000);
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
        <>
          <Animated.View
            style={{
              transform: [{translateY: popupY}],
              zIndex: 1,
            }}>
            <Popup
              background={popupBackground}
              prompt={null}
              closePopup={closePopup}
              handleRouteOverride={null}
              subtext={subtext}>
              {popupText}
            </Popup>
          </Animated.View>
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
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                    <Text
                      style={{
                        ...styles.inputStyles,
                        borderBottomColor: 'white',
                      }}>
                      +1
                    </Text>
                    <TextInput
                      style={{...styles.inputStyles, width: width - 80}}
                      placeholder="Number"
                      value={number}
                      onChangeText={e => setNumber(e.valueOf())}
                    />
                  </View>
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
                      backgroundColor: 'pink',
                    }}
                    onPress={handleDeleteAccount}>
                    <Text
                      style={{...styles.buttonTextStyles, color: '#de3623'}}>
                      Delete account
                    </Text>
                  </TouchableOpacity>
                </View>
                {error && <Text style={styles.errorStyle}>{error}</Text>}
              </SafeAreaView>
            </TouchableWithoutFeedback>
          </ScrollView>
        </>
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
    color: '#03c04a',
  },
  buttonStyles: {
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#AFE1AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputsStyles: {
    marginTop: 50,
    backgroundColor: 'white',
    marginHorizontal: 20,
    gap: 10,
  },
  inputStyles: {
    padding: 10,
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
