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
  PermissionsAndroid,
} from 'react-native';
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';
import {UserContext} from '../../UserContext';
import {STORE_KEY, APP_URL, DEV_URL, GOOGLE_API_KEY} from '@env';
import uuid from 'react-uuid';
import {SelectList} from 'react-native-dropdown-select-list';
import Popup from '../Components/Popup';
import Modal from '../Components/Modal';
import Clipboard from '@react-native-clipboard/clipboard';
import Geolocation from 'react-native-geolocation-service';
import {
  PERMISSIONS,
  request,
  check,
  openSettings,
} from 'react-native-permissions';
import Contacts from 'react-native-contacts';
import FontAwesome from 'react-native-vector-icons/FontAwesome5';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';

const {width, height} = Dimensions.get('screen');

//details page update
const RouteDetails = ({route, navigation}) => {
  const [popupY, setPopupY] = useState(new Animated.Value(-height * 2));
  const [modalY, setModalY] = useState(new Animated.Value(-height * 2));
  const [overrideModalY, setOverrideModalY] = useState(
    new Animated.Value(-height * 2),
  );
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
  const [quickRoute, setQuickRoute] = useState(false);
  const [jwt, setJwt, handleStoreToken, handleFetchToken, verifyRefreshToken] =
    useContext(UserContext);
  const {routeId} = route.params;
  const [loading, setLoading] = useState(true);
  const [modalElement, setModalElement] = useState();
  const [modalState, setModalState] = useState(false);
  const [update, setUpdate] = useState(false);
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const hideKeyboard = Keyboard.addListener('keyboardDidHide', () => {
      scrollRef.current?.scrollTo({
        y: 0,
        animated: true,
      });
    });

    return () => {
      hideKeyboard.remove();
    };
  }, []);

  useEffect(() => {
    handleFetchContacts();
  }, []);

  useEffect(() => {
    if (modalState) {
      setModalElement(() => (
        <Modal
          background={'white'}
          closeModal={closeModal}
          onClick={handleAddSubscribers}
          list={contacts}
          subscribers={subscribers}
          state={modalState}>
          Contacts
        </Modal>
      ));
    } else {
      setTimeout(() => {
        setModalElement(null);
      }, 500);
    }
  }, [subscribers, contacts, modalState]);

  const openModal = () => {
    scrollRef.current?.scrollTo({
      y: 0,
      animated: true,
    });
    Animated.timing(modalY, {
      duration: 300,
      toValue: 0,
      useNativeDriver: true,
    }).start();
    setModalState(true);
  };

  const closeModal = () => {
    Animated.timing(modalY, {
      duration: 300,
      toValue: -height,
      useNativeDriver: true,
    }).start();
    setModalState(false);
  };

  const openPopup = (text, background, subtext) => {
    scrollRef.current?.scrollTo({
      y: 0,
      animated: true,
    });
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

  const openOverrideModal = (text, background, subtext) => {
    scrollRef.current?.scrollTo({
      y: 0,
      animated: true,
    });
    setPopupText(text);
    setPopupBackground(background);
    setSubtext(subtext);

    Animated.timing(overrideModalY, {
      duration: 300,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const closeOverrideModal = () => {
    Animated.timing(overrideModalY, {
      duration: 300,
      toValue: -height,
      useNativeDriver: true,
    }).start();
  };

  async function handleFetchContacts() {
    if (Platform.OS === 'ios') {
      request(PERMISSIONS.IOS.CONTACTS).then(result => {
        if (result === 'granted') {
          Contacts.getAll()
            .then(data => {
              setContacts(data);
              setLoading(false);
            })
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
            .then(data => {
              setContacts(data);
            })
            .catch(err => {
              console.log('Unable to get contacts: ', err);
            });
        }
      });
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
            setDeliveryMode(data.body.message.deliveryMode ? true : false);
            setQuickRoute(data.body.message.quickRoute);
            setPaused(data.body.message.paused);
          } else {
            console.log('Route no longer exists.');
            navigation.navigate('Routes', {
              update: uuid(),
            });
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
  }, [jwt, update]);

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
          openPopup(`Unable to create route:`, '#DC143C', data.body.message[0]);
          setTimeout(() => {
            closePopup();
          }, 3000);
        }
      })
      .catch(error => {
        setLoading(false);
        openPopup(`Something went wrong...`, '#DC143C');
        setTimeout(() => {
          closePopup();
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
          openPopup(`Unable to delete route`, '#DC143C');
          setTimeout(() => {
            closePopup();
          }, 3000);
        }
      })
      .catch(error => {
        setLoading(false);
        openPopup(`Something went wrong...`, '#DC143C');
        setTimeout(() => {
          closePopup();
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
            timezone: new Date()
              .toLocaleString('en', {timeZoneName: 'short'})
              .split(' ')
              .pop(),
          }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.status === 200) {
              openPopup('Route activated successfully', '#1e90ff');
              setTimeout(() => {
                closePopup();
              }, 3000);
            } else if (data.status === 409) {
              setActive(false);
              openOverrideModal(
                'Another route is already active, would you like to override it?',
                'white',
              );
            } else {
              setActive(false);
              openPopup('Unable to activate route', '#DC143C');
              setTimeout(() => {
                closePopup();
              }, 3000);
            }
          })
          .catch(error => {
            console.log('ERROR:', error);
            setActive(false);
            openPopup('Unable to activate route', '#DC143C');
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
            timezone: new Date()
              .toLocaleString('en', {timeZoneName: 'short'})
              .split(' ')
              .pop(),
          }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.status !== 200) {
              setActive(true);
              openPopup('Unable to deactive route', '#DC143C');
              setTimeout(() => {
                closePopup();
              }, 3000);
            } else {
              openPopup('Route deactivated successfully', '#1e90ff');
              setTimeout(() => {
                closePopup();
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

  async function handleRouteOverride() {
    closeOverrideModal();
    Geolocation.getCurrentPosition(
      position => {
        const date = new Date(position.timestamp);
        fetch(`${APP_URL}/api/v1/routes/activate/override`, {
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
            timezone: new Date()
              .toLocaleString('en', {timeZoneName: 'short'})
              .split(' ')
              .pop(),
          }),
        })
          .then(res => res.json())
          .then(async data => {
            if (data.status === 200) {
              openPopup('Route overriden successfully', '#1e90ff');
              setTimeout(() => {
                closePopup();
              }, 3000);
            } else {
              openPopup('Unable to override route', '#DC143C');
              setTimeout(() => {
                closePopup();
              }, 3000);
            }
            setUpdate(prev => !prev);
          })
          .catch(error => {
            console.log('Unable to update location with ERROR:', error);
            openPopup(
              'Something went wrong...',
              '#DC143C',
              JSON.stringify(error),
            );
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
  }

  const handleUnpause = async e => {
    setPaused(false);

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
          sendUnpausedLocation();
        } else {
          console.log('Permission not granted');
          setPaused(true);
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
          sendUnpausedLocation();
        } else {
          console.log('Permission not granted');
          setPaused(true);
        }
      }
    } catch (err) {
      console.log('Err: ', err);
      setPaused(true);
    }
  };

  const sendUnpausedLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        fetch(`${APP_URL}/api/v1/routes/unpause`, {
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
            timezone: new Date()
              .toLocaleString('en', {timeZoneName: 'short'})
              .split(' ')
              .pop(),
          }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.status !== 200) {
              setPaused(true);
              openPopup('Unable to unpause route', '#DC143C');
              setTimeout(() => {
                closePopup();
              }, 3000);
            } else {
              openPopup('Route unpaused successfully', '#1e90ff');
              setTimeout(() => {
                closePopup();
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

  const data = [
    {key: '1', value: '5m'},
    {key: '2', value: '10m'},
    {key: '3', value: '20m'},
    {key: '4', value: '30m'},
    {key: '5', value: '60m'},
  ];

  return (
    <ScrollView
      style={{flex: 1}}
      scrollEnabled={!false}
      ref={scrollRef}
      keyboardShouldPersistTaps="handled">
      {!loading ? (
        <>
          <Animated.View
            style={{
              transform: [{translateY: modalY}],
              zIndex: 1,
              minHeight: modalState ? height : null,
            }}>
            {modalElement}
          </Animated.View>
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
          <Animated.View
            style={{
              transform: [{translateY: overrideModalY}],
              zIndex: 1,
            }}>
            <Popup
              background={popupBackground}
              prompt={true}
              closePopup={closeOverrideModal}
              handleRouteOverride={handleRouteOverride}>
              {popupText}
            </Popup>
          </Animated.View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
            style={{display: modalState ? 'none' : 'flex'}}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <>
                <TouchableOpacity
                  style={{
                    backgroundColor: active
                      ? paused
                        ? '#FFE992'
                        : '#AFE1AF'
                      : 'gainsboro',
                    borderRadius: 10,
                    marginTop: 50,
                    marginBottom: 10,
                    marginHorizontal: 20,
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={() =>
                    active
                      ? paused
                        ? handleUnpause()
                        : handleDeactivation()
                      : handleActivation()
                  }>
                  {quickRoute ? (
                    <FontAwesome
                      name="fire"
                      size={30}
                      color={active ? (paused ? '#FFC30B' : '#03c04a') : 'gray'}
                      style={{paddingVertical: 10, paddingHorizontal: 20}}
                    />
                  ) : (
                    <Text
                      style={{
                        ...styles.headerTextStyles,
                        color: active
                          ? paused
                            ? '#FFC30B'
                            : '#03c04a'
                          : 'gray',
                      }}>
                      {active ? (paused ? 'Paused' : 'Active') : 'Inactive'}
                    </Text>
                  )}
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
                  {!active ? (
                    <ScrollView
                      horizontal={true}
                      keyboardShouldPersistTaps="handled">
                      <GooglePlacesAutocomplete
                        placeholder={destination}
                        query={{key: GOOGLE_API_KEY}}
                        styles={{
                          textInputContainer: {
                            flex: 1,
                            width: 2000, //this is not correct, but it works for now
                          },
                          textInput: styles.inputStyles,
                        }}
                        fetchDetails={true}
                        onPress={(data, details = null) => {
                          setDestination(data.description);
                        }}
                        onFail={error => console.log(error)}
                        onNotFound={() => console.log('no results')}
                        listEmptyComponent={() => (
                          <View style={{flex: 1}}>
                            <Text>No results were found</Text>
                          </View>
                        )}
                      />
                    </ScrollView>
                  ) : (
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
                  )}
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
                          : 'black',
                    }}
                    onPress={openModal}
                    disabled={subscribers.length >= 5 || active ? true : false}>
                    <Text
                      style={{
                        ...styles.buttonTextStyles,
                        color: active ? 'gray' : 'white',
                      }}>
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
                          } else {
                            Linking.openURL(`tel:${value.number}`);
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
                              onPress={() =>
                                !active ? removeSubscriber(index) : null
                              }>
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
                      backgroundColor: active ? 'gainsboro' : '#AFE1AF',
                    }}
                    onPress={handleUpdateRoute}
                    disabled={active}>
                    {!loading ? (
                      <Text
                        style={{
                          ...styles.buttonTextStyles,
                          color: active ? 'gray' : '#03c04a',
                        }}>
                        Save
                      </Text>
                    ) : (
                      <ActivityIndicator size="small" color="black" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      ...styles.buttonStyles,
                      backgroundColor: active ? 'gainsboro' : 'pink',
                    }}
                    onPress={handleDeleteRoute}>
                    <Text
                      style={{
                        ...styles.buttonTextStyles,
                        color: active ? 'gray' : '#de3623',
                      }}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={{textAlign: 'center', color: 'gray'}}>
                  *Changes will not take effect until you save
                </Text>
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
