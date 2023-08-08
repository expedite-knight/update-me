import React, {useState, useContext, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Animated,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Linking,
} from 'react-native';
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';
import {UserContext} from '../../UserContext';
import {STORE_KEY, APP_URL, DEV_URL} from '@env';
import uuid from 'react-uuid';
import {SelectList} from 'react-native-dropdown-select-list';
import Popup from '../Components/Popup';
import Modal from '../Components/Modal';
import RNSecureStorage, {ACCESSIBLE} from 'rn-secure-storage';
import EncryptedStorage from 'react-native-encrypted-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import Geolocation from 'react-native-geolocation-service';
import {
  PERMISSIONS,
  request,
  check,
  openSettings,
} from 'react-native-permissions';

const {width, height} = Dimensions.get('screen');

const RouteDetails = ({route, navigation}) => {
  const [errorPopupY, setErrorPopupY] = useState(
    new Animated.Value(-height * 2),
  );
  const [popupY, setPopupY] = useState(new Animated.Value(-height * 2));
  const [popupText, setPopupText] = useState('');
  const [popupBackground, setPopupBackground] = useState('#1e90ff');
  const [subtext, setSubtext] = useState(null);
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [interval, setInterval] = useState('');
  const [subscribers, setSubscribers] = useState([]);
  const [active, setActive] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [jwt, setJwt, handleStoreToken, handleFetchToken] =
    useContext(UserContext);
  const {routeId} = route.params;
  const [loading, setLoading] = useState(true);
  const [modalElement, setModalElement] = useState();
  const [modalState, setModalState] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    handleFetchContacts();
  }, []);

  useEffect(() => {
    setModalElement(() => (
      <Modal
        background={'white'}
        closeModal={closePopup}
        onClick={handleAddSubscribers}
        list={contacts}
        subscribers={subscribers}
        state={modalState}>
        Contacts
      </Modal>
    ));
  }, [subscribers, modalState, contacts]);

  const openPopup = (text, background, subtext, error) => {
    scrollRef.current?.scrollTo({
      y: 0,
      animated: true,
    });
    setPopupText(text);
    setPopupBackground(background);
    setSubtext(subtext);
    setModalState(prev => !prev);

    Animated.timing(error ? errorPopupY : popupY, {
      duration: 300,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const closePopup = error => {
    Animated.timing(error ? errorPopupY : popupY, {
      duration: 300,
      toValue: -height,
      useNativeDriver: true,
    }).start();
    setModalState(prev => !prev);
  };

  async function handleFetchContacts() {
    if (RNSecureStorage) {
      RNSecureStorage.get('contacts')
        .then(data => {
          setContacts(JSON.parse(data));
        })
        .catch(err => {
          console.log(err);
        });
    } else {
      try {
        const data = await EncryptedStorage.getItem('contacts');
        setContacts(JSON.parse(data));
      } catch (error) {
        console.log('Err retrieving contacts: ', error);
      }
    }
  }

  const handleAddSubscribers = selectedContacts => {
    selectedContacts.forEach(contact => {
      setSubscribers(prev => {
        const res = prev.some(
          element => element.number == '+1'.concat(contact),
        );

        if (res) return [...prev];
        return [
          ...prev,
          {number: '+1'.concat(contact), verified: true, new: true},
        ];
      });
    });

    closePopup();
  };

  const removeSubscriber = index => {
    const temp = subscribers;
    temp.splice(index, 1);
    setSubscribers(prev => [...temp]);
  };

  useEffect(() => {
    if (jwt) {
      fetch(`${APP_URL}/api/v1/routes/details`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: jwt,
          'User-Agent': 'any-name',
        },
        body: JSON.stringify({
          route: routeId,
        }),
        mode: 'cors',
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === 200) {
            setName(data.body.message.routeName);
            setDestination(data.body.message.destination);
            setInterval(JSON.stringify(data.body.message.interval));
            setActive(data.body.message.active);
            setSubscribers([...data.body.message.subscribers]);
            //change this eventually but it can be undefined and that might break stuff
            setDeliveryMode(data.body.message.deliveryMode ? true : false);
          } else {
            console.log('Something went wrong...');
          }
          setLoading(false);
        })
        .catch(error => {
          console.log('error fetching details:', error[0]);
        });
    } else {
      console.log('User not logged in.');
      navigation.navigate('Login');
    }
  }, [jwt]);

  function handleUpdateRoute() {
    if (active) return null;
    setLoading(true);
    const formattedSubscribers = subscribers.map(sub => JSON.stringify(sub));
    fetch(`${APP_URL}/api/v1/routes/update`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: jwt,
        'User-Agent': 'any-name',
      },
      body: JSON.stringify({
        route: routeId,
        subscribers: formattedSubscribers,
        name: name,
        interval: interval,
      }),
      mode: 'cors',
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 204) {
          navigation.navigate('Routes', {
            update: uuid(),
            updatedRoute: 'success',
            createdRoute: '',
            deletedRoute: '',
          });
        } else {
          setLoading(false);
          openPopup(
            `Unable to create route:`,
            '#DC143C',
            data.body.message[0],
            true,
          );
          setTimeout(() => {
            closePopup(true);
          }, 3000);
        }
      })
      .catch(error => {
        setLoading(false);
        openPopup(`Something went wrong...`, '#DC143C', null, true);
        setTimeout(() => {
          closePopup(true);
        }, 3000);
      });
  }

  function handleDeleteRoute() {
    if (active) return null;
    setLoading(true);
    fetch(`${APP_URL}/api/v1/routes/delete`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: jwt,
        'User-Agent': 'any-name',
      },
      body: JSON.stringify({
        route: routeId,
      }),
      mode: 'cors',
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 204) {
          navigation.navigate('Routes', {
            update: uuid(),
            deletedRoute: 'success',
            createdRoute: '',
            updatedRoute: '',
          });
        } else {
          setLoading(false);
          openPopup(`Unable to delete route`, '#DC143C', null, true);
          setTimeout(() => {
            closePopup(true);
          }, 3000);
        }
      })
      .catch(error => {
        setLoading(false);
        openPopup(`Something went wrong...`, '#DC143C', null, true);
        setTimeout(() => {
          closePopup(true);
        }, 3000);
      });
  }

  const sendActiveLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        fetch(`${APP_URL}/api/v1/routes/activate`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: jwt,
            'User-Agent': 'any-name',
          },
          mode: 'cors',
          body: JSON.stringify({
            route: routeId,
            currentLocation: {
              lat: position.coords.latitude,
              long: position.coords.longitude,
            },
            offset: new Date().getTimezoneOffset() / 60,
          }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.status === 200) {
              openPopup('Route activated successfully', '#1e90ff', null, true);
              setTimeout(() => {
                closePopup(true);
              }, 3000);
            } else if (data.status === 409) {
              setActive(false);
              openPopup(
                'Another route is already active, would you like to override it?',
                'white',
                true,
                routeId,
              );
            } else {
              setActive(false);
              openPopup('Route not activated', 'red');
              setTimeout(() => {
                closePopup();
              }, 3000);
            }
          })
          .catch(error => {
            console.log('ERROR:', error);
            setActive(false);
            openPopup('Route not activated', 'red');
            setTimeout(() => {
              closePopup();
            }, 3000);
          });
      },
      error => {
        console.log(error.code, error.message);
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

  const handleActivation = async e => {
    setActive(true);

    try {
      if (Platform.OS === 'android') {
        const frontPerm = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Foreground Geolocation Permission',
            message: 'Can we access your location?',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        const backPerm = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
          {
            title: 'Background Geolocation Permission',
            message: 'Can we access your location in the background?',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (frontPerm === 'granted' && backPerm === 'granted') {
          sendActiveLocation();
        } else {
          console.log('Permission not granted');
          setActive(false);
        }
      } else {
        const frontPerm = await request(
          PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        ).then(result => {
          if (result === 'blocked') {
            openSettings().catch(err => console.log('Unable to open settings'));
          } else {
            return result;
          }
        });
        const backPerm = await request(PERMISSIONS.IOS.LOCATION_ALWAYS).then(
          result => {
            if (result === 'blocked') {
              openSettings().catch(err =>
                console.log('Unable to open settings'),
              );
            } else {
              return result;
            }
          },
        );
        if (frontPerm === 'granted' && backPerm === 'granted') {
          sendActiveLocation();
        } else {
          console.log('Permission not granted');
          setActive(false);
        }
      }
    } catch (err) {
      console.log('Err: ', err);
      setActive(false);
    }
  };

  const sendDeactiveLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        fetch(`${APP_URL}/api/v1/routes/deactivate`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: jwt,
            'User-Agent': 'any-name',
          },
          mode: 'cors',
          body: JSON.stringify({
            route: routeId,
            currentLocation: {
              lat: position.coords.latitude,
              long: position.coords.longitude,
            },
            offset: new Date().getTimezoneOffset() / 60,
          }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.status !== 200) {
              setActive(true);
              openPopup('Unable to deactive route', 'red');
              setTimeout(() => {
                closePopup();
              }, 3000);
            } else {
              openPopup(
                'Route deactivated successfully',
                '#1e90ff',
                null,
                true,
              );
              setTimeout(() => {
                closePopup(true);
              }, 3000);
            }
          })
          .catch(error => {
            console.log('ERROR:', error);
          });
      },
      error => {
        console.log(error.code, error.message);
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

  const handleDeactivation = async e => {
    setActive(false);

    try {
      if (Platform.OS === 'android') {
        const frontPerm = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Foreground Geolocation Permission',
            message: 'Can we access your location?',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        const backPerm = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
          {
            title: 'Background Geolocation Permission',
            message: 'Can we access your location in the background?',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (frontPerm === 'granted' && backPerm === 'granted') {
          sendDeactiveLocation();
        } else {
          console.log('Permission not granted');
          setActive(true);
        }
      } else {
        const frontPerm = await request(
          PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        ).then(result => {
          if (result === 'blocked') {
            openSettings().catch(err => console.log('Unable to open settings'));
          } else {
            return result;
          }
        });
        const backPerm = await request(PERMISSIONS.IOS.LOCATION_ALWAYS).then(
          result => {
            if (result === 'blocked') {
              openSettings().catch(err =>
                console.log('Unable to open settings'),
              );
            } else {
              return result;
            }
          },
        );
        if (frontPerm === 'granted' && backPerm === 'granted') {
          sendDeactiveLocation();
        } else {
          console.log('Permission not granted');
          setActive(true);
        }
      }
    } catch (err) {
      console.log('Err: ', err);
      setActive(true);
    }
  };

  const data = [
    {key: '1', value: '5m'},
    {key: '2', value: '10m'},
    {key: '3', value: '20m'},
    {key: '4', value: '30m'},
    {key: '5', value: '60m'},
  ];

  return (
    <ScrollView style={{flex: 1}} scrollEnabled={!modalState} ref={scrollRef}>
      {!loading ? (
        <>
          <Animated.View
            style={{
              transform: [{translateY: popupY}],
              zIndex: 1,
            }}>
            {modalElement}
          </Animated.View>
          <Animated.View
            style={{
              transform: [{translateY: errorPopupY}],
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
              <>
                <TouchableOpacity
                  style={{
                    backgroundColor: active ? '#AFE1AF' : 'pink',
                    borderRadius: 10,
                    marginTop: 50,
                    marginBottom: 10,
                    marginHorizontal: 20,
                  }}
                  onPress={() =>
                    active ? handleDeactivation() : handleActivation()
                  }>
                  <Text
                    style={{
                      ...styles.headerTextStyles,
                      color: active ? '#03c04a' : '#de3623',
                    }}>
                    {active ? 'Active' : 'Inactive'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Clipboard.setString(routeId)}>
                  <Text
                    style={{
                      textAlign: 'center',
                      color: 'gray',
                    }}>
                    {routeId}
                  </Text>
                </TouchableOpacity>
                <View
                  style={{
                    ...styles.inputsStyles,
                    marginTop: 50,
                    marginHorizontal: 20,
                  }}>
                  <TextInput
                    style={{
                      ...styles.inputStyles,
                      color: active ? 'gray' : 'black',
                    }}
                    placeholder="Route name"
                    value={name}
                    onChangeText={e => setName(e.valueOf())}
                    editable={!active}
                  />
                  <TextInput
                    style={{
                      ...styles.inputStyles,
                      color: active ? 'gray' : 'black',
                    }}
                    placeholder="Destination address"
                    value={destination}
                    onChangeText={e => setDestination(e.valueOf())}
                    enabled={false}
                    editable={false}
                  />
                  {active || deliveryMode ? (
                    <Text
                      style={{
                        fontSize: 20,
                        padding: 12,
                        paddingHorizontal: 22,
                        borderWidth: 1,
                        borderRadius: 10,
                        borderColor: 'gainsboro',
                        color: 'gainsboro',
                      }}>
                      {deliveryMode ? 'Delivery Mode' : interval.concat('m')}
                    </Text>
                  ) : (
                    <SelectList
                      setSelected={val => setInterval(val)}
                      data={data}
                      save="value"
                      placeholder={interval.concat('m')}
                      searchPlaceholder="Interval"
                      dropdownTextStyles={{fontSize: 16}}
                      inputStyles={{
                        fontSize: 20,
                      }}
                    />
                  )}
                  <TouchableOpacity
                    style={{
                      ...styles.buttonStyles,
                      backgroundColor:
                        subscribers.length >= 5 || active
                          ? 'rgba(0, 0, 0, .2)'
                          : '#1e90ff',
                      borderWidth: 1,
                      borderColor:
                        subscribers.length >= 5 || active
                          ? 'gainsboro'
                          : '#1e90ff',
                    }}
                    onPress={openPopup}
                    disabled={subscribers.length >= 5 || active ? true : false}>
                    <Text style={{...styles.buttonTextStyles, color: 'white'}}>
                      Add subscribers
                    </Text>
                  </TouchableOpacity>
                  {subscribers.length >= 1 ? (
                    subscribers.map((value, index) => (
                      <TouchableOpacity
                        onPress={() => {
                          if (!value.verified) {
                            const message = encodeURI(
                              'Hello, this is Expedite Knight. You have not verified your number yet, text "verify" to +1 704-686-8257 to start receiving SMS updates',
                            );
                            try {
                              Linking.openURL(
                                `sms:${value.number}${
                                  Platform.OS === 'ios' ? '&' : '?'
                                }body=${message}.`,
                              );
                            } catch (err) {
                              console.log('error opening imessage or sms');
                            }
                          }
                        }}
                        key={index}>
                        <View index={index} style={styles.subscriber}>
                          <View
                            style={{
                              flexDirection: 'row',
                              gap: 10,
                              alignItems: 'center',
                            }}>
                            <Text
                              style={{
                                fontSize: 20,
                                color: value.new
                                  ? '#1bab05'
                                  : active
                                  ? 'gray'
                                  : 'black',
                              }}>
                              {value.number}
                            </Text>
                            {!value.verified ? (
                              <Icon
                                name="alert-circle-outline"
                                size={25}
                                color={'#de3623'}
                              />
                            ) : null}
                          </View>
                          {!active && (
                            <TouchableOpacity
                              style={styles.deleteButton}
                              onPress={() => removeSubscriber(index)}>
                              <Icon name="trash" size={25} color={'#de3623'} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={{textAlign: 'center'}}>
                      No subscribers yet
                    </Text>
                  )}
                </View>
                <View
                  style={{gap: 10, marginVertical: 50, marginHorizontal: 20}}>
                  <TouchableOpacity
                    style={{
                      ...styles.buttonStyles,
                      backgroundColor: active ? 'gainsboro' : 'pink',
                      borderColor: active ? 'gainsboro' : '#de3623',
                    }}
                    onPress={handleUpdateRoute}
                    disabled={!active}>
                    {!loading ? (
                      <Text
                        style={{
                          ...styles.buttonTextStyles,
                          color: active ? 'white' : '#de3623',
                        }}>
                        Update
                      </Text>
                    ) : (
                      <ActivityIndicator size="small" color="black" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      ...styles.buttonStyles,
                      backgroundColor: active ? 'gray' : 'black',
                      borderColor: active ? 'gray' : 'black',
                    }}
                    onPress={handleDeleteRoute}>
                    <Text style={{...styles.buttonTextStyles, color: 'white'}}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            </TouchableWithoutFeedback>
          </ScrollView>
        </>
      ) : (
        <View style={{...styles.containerStyle, padding: 50}}>
          <ActivityIndicator size="small" color="black" />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  containerStyle: {
    flex: 1,
    alignItems: 'center',
    overflow: 'visible',
    minHeight: height,
  },
  headerTextStyles: {
    fontSize: 20,
    fontWeight: '500',
    color: 'black',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    textAlign: 'center',
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
    backgroundColor: 'white',
    gap: 10,
  },
  inputStyles: {
    padding: 10,
    borderBottomColor: 'gainsboro',
    borderBottomWidth: 1,
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

export default RouteDetails;
