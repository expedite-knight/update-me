import React, {useState, useContext, useEffect, useMemo, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
  Animated,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import CheckBox from '@react-native-community/checkbox';
import Icon from 'react-native-vector-icons/Ionicons';
import {UserContext} from '../../UserContext';
import {STORE_KEY, APP_URL, DEV_URL, GOOGLE_API_KEY} from '@env';
import uuid from 'react-uuid';
import {SelectList} from 'react-native-dropdown-select-list';
import Popup from '../Components/Popup';
import Modal from '../Components/Modal';
import RNSecureStorage, {ACCESSIBLE} from 'rn-secure-storage';
import EncryptedStorage from 'react-native-encrypted-storage';
import Contacts from 'react-native-contacts';
import {
  PERMISSIONS,
  request,
  check,
  openSettings,
} from 'react-native-permissions';
import Geolocation from 'react-native-geolocation-service';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';

const {width, height} = Dimensions.get('screen');

//updating
const CreateRoute = ({navigation}) => {
  const [errorPopupY, setErrorPopupY] = useState(
    new Animated.Value(-height * 2),
  );
  const [popupY, setPopupY] = useState(new Animated.Value(-height * 2));
  const [popupText, setPopupText] = useState('');
  const [popupBackground, setPopupBackground] = useState('#1e90ff');
  const [subtext, setSubtext] = useState(null);
  const [quickRoute, setQuickRoute] = useState(false);
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [interval, setInterval] = useState('');
  const [subscribers, setSubscribers] = useState([]);
  const [deliveryMode, setDeliveryMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [jwt, setJwt, handleStoreToken, handleFetchToken] =
    useContext(UserContext);
  const [modalElement, setModalElement] = useState();
  const [modalState, setModalState] = useState(false);
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
    fetchSession();
  }, []);

  async function fetchSession() {
    try {
      const session = await EncryptedStorage.getItem('createRouteSession');

      if (session !== undefined) {
        setDestination(JSON.parse(session).destination);
        setName(JSON.parse(session).name);
        setQuickRoute(JSON.parse(session).quickRoute);
        setDeliveryMode(JSON.parse(session).deliveryMode);
        setInterval(JSON.parse(session).interval);
        setInter;
        if (JSON.parse(session).subscribers)
          setSubscribers(JSON.parse(session).subscribers);
      }
    } catch (error) {
      // There was an error on the native side
    }
  }

  useEffect(() => {
    try {
      EncryptedStorage.setItem(
        'createRouteSession',
        JSON.stringify({
          destination: destination,
          name: name,
          quickRoute: quickRoute,
          deliveryMode: deliveryMode,
          subscribers: subscribers,
          interval: interval,
        }),
      );
    } catch (error) {
      console.log('could not store');
    }
  }, [destination, name, quickRoute, deliveryMode, subscribers, interval]);

  useEffect(() => {
    if (modalState) {
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
    } else {
      //this forces a bogus update to the ele so selected contacts reset
      //and we allow the transition to run
      setTimeout(() => {
        setModalElement(null);
      }, 500);
    }
  }, [subscribers, modalState, contacts]);

  const openPopup = (text, background, subtext, error) => {
    scrollRef.current?.scrollTo({
      y: 0,
      animated: true,
    });
    setPopupText(text);
    setPopupBackground(background);
    setSubtext(subtext);

    Animated.timing(error ? errorPopupY : popupY, {
      duration: 300,
      toValue: 0,
      useNativeDriver: true,
    }).start();

    !error && setModalState(true);
  };

  const closePopup = error => {
    Animated.timing(error ? errorPopupY : popupY, {
      duration: 300,
      toValue: -height,
      useNativeDriver: true,
    }).start();
    !error && setModalState(false);
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
              setLoading(false);
            })
            .catch(err => {
              console.log('Unable to get contacts: ', err);
              setLoading(false);
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

  const handleCreateRoute = () => {
    setLoading(true);
    Geolocation.getCurrentPosition(
      position => {
        const formattedSubscribers = subscribers.map(sub =>
          JSON.stringify(sub),
        );
        fetch(`${APP_URL}/api/v1/routes/create`, {
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
            routeName: name,
            destination: destination,
            quickRoute: quickRoute,
            interval: interval,
            subscribers: formattedSubscribers,
            deliveryMode: deliveryMode,
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
            if (data.status === 201) {
              setDeliveryMode(false);
              setQuickRoute(false);
              setName('');
              setDestination('');
              setInterval('');
              setSubscribers([]);
              navigation.navigate('Routes', {
                update: uuid(),
                createdRoute: 'success',
                updatedRoute: '',
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
            openPopup('Something went wrong...', '#DC143C', null, true);
            setTimeout(() => {
              closePopup(true);
            }, 3000);
          });
      },
      error => {
        console.log(error.code, error.message);
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

  console.log('Dest: ', destination);

  const data = [
    {key: '1', value: '5m'},
    {key: '2', value: '10m'},
    {key: '3', value: '20m'},
    {key: '4', value: '30m'},
    {key: '5', value: '60m'},
  ];

  return (
    <>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        style={{flex: 1}}
        scrollEnabled={!modalState}
        ref={scrollRef}
        horizontal={false}>
        {!loading ? (
          <>
            <Animated.View
              style={{
                transform: [{translateY: popupY}],
                zIndex: 1,
                minHeight: modalState ? height : null,
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
            <>
              <Text style={styles.headerTextStyles}>New Route</Text>
              <View
                style={{
                  ...styles.inputsStyles,
                  marginTop: 50,
                  marginHorizontal: 20,
                }}>
                <TextInput
                  style={styles.inputStyles}
                  placeholder="Route name"
                  value={name}
                  onChangeText={e => setName(e.valueOf())}
                />
                {/* <TextInput
                  style={styles.inputStyles}
                  placeholder="Destination address"
                  value={destination}
                  onChangeText={e => setDestination(e.valueOf())}
                /> */}
                <ScrollView
                  horizontal={true}
                  keyboardShouldPersistTaps="handled">
                  <GooglePlacesAutocomplete
                    placeholder="Destination"
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
                {deliveryMode ? (
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
                    Delivery Mode
                  </Text>
                ) : (
                  <SelectList
                    setSelected={val => setInterval(val)}
                    data={data}
                    save="value"
                    placeholder={interval ? interval : 'Interval'}
                    searchPlaceholder="Interval"
                    dropdownTextStyles={{fontSize: 16}}
                    inputStyles={{
                      fontSize: 20,
                    }}
                  />
                )}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-evenly',
                    marginVertical: 10,
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: Platform.OS === 'ios' ? 10 : 0,
                    }}>
                    <CheckBox
                      disabled={false}
                      value={quickRoute}
                      onValueChange={value => setQuickRoute(value)}
                    />
                    <Text style={{fontSize: 15}}>Quick Route</Text>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: Platform.OS === 'ios' ? 10 : 0,
                    }}>
                    <CheckBox
                      disabled={false}
                      value={deliveryMode}
                      onValueChange={value => setDeliveryMode(value)}
                    />
                    <Text style={{fontSize: 15}}>Delivery Mode</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={{
                    ...styles.buttonStyles,
                    backgroundColor:
                      subscribers.length >= 5 ? 'rgba(0, 0, 0, .2)' : 'black',
                  }}
                  onPress={openPopup}
                  disabled={subscribers.length >= 5 ? true : false}>
                  <Text style={{...styles.buttonTextStyles, color: 'white'}}>
                    Add subscribers
                  </Text>
                </TouchableOpacity>
                {subscribers.length >= 1 ? (
                  subscribers.map((value, index) => (
                    <View key={index} index={index} style={styles.subscriber}>
                      <View
                        style={{
                          flexDirection: 'row',
                          gap: 10,
                          alignItems: 'center',
                        }}>
                        <Text
                          style={{
                            fontSize: 20,
                            color: value.new ? '#1bab05' : 'black',
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
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => {
                          removeSubscriber(index);
                        }}>
                        <Icon name="trash" size={25} color={'#de3623'} />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={{textAlign: 'center'}}>No subscribers yet</Text>
                )}
              </View>
              <View style={{gap: 10, marginVertical: 50, marginHorizontal: 20}}>
                <TouchableOpacity
                  style={styles.buttonStyles}
                  onPress={handleCreateRoute}>
                  {!loading ? (
                    <Text style={styles.buttonTextStyles}>Create</Text>
                  ) : (
                    <ActivityIndicator size="small" color="black" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={{...styles.buttonStyles, backgroundColor: 'pink'}}
                  onPress={() => {
                    setName('');
                    setDeliveryMode(false);
                    setDestination('');
                    setQuickRoute(false);
                    setSubscribers([]);
                    setInterval('');
                  }}>
                  <Text style={{...styles.buttonTextStyles, color: '#DC143C'}}>
                    Reset
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          </>
        ) : (
          <View
            style={{
              ...styles.containerStyle,
              padding: 50,
            }}>
            <ActivityIndicator size="small" color="black" />
          </View>
        )}
      </ScrollView>
    </>
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
    backgroundColor: 'white',
    gap: 10,
  },
  inputStyles: {
    paddingHorizontal: 10,
    paddingVertical: 10,
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

export default CreateRoute;
