import React, {useState, useContext, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import CheckBox from '@react-native-community/checkbox';
import Icon from 'react-native-vector-icons/Ionicons';
import {UserContext} from '../../UserContext';
import {STORE_KEY, APP_URL, DEV_URL} from '@env';
import uuid from 'react-uuid';
import {SelectList} from 'react-native-dropdown-select-list';
import DropDownPicker from 'react-native-dropdown-picker';
import {
  PERMISSIONS,
  request,
  check,
  openSettings,
} from 'react-native-permissions';
import Contacts from 'react-native-contacts';
import Popup from '../Components/Popup';
import Modal from '../Components/Modal';

const {width, height} = Dimensions.get('screen');

//we should cache the contacts in the secure store so we can access them easier
const CreateRoute = ({navigation}) => {
  const [errorPopupY, setErrorPopupY] = useState(new Animated.Value(-height));
  const [popupY, setPopupY] = useState(new Animated.Value(-height));
  const [popupText, setPopupText] = useState('');
  const [popupBackground, setPopupBackground] = useState('#1e90ff');
  const [subtext, setSubtext] = useState(null);
  const [quickRoute, setQuickRoute] = useState(false);
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [interval, setInterval] = useState('');
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [jwt, setJwt, handleStoreToken, handleFetchToken] =
    useContext(UserContext);

  const handleAddSubscribers = selectedContacts => {
    //when adding subscribers make sure that there are not any repeats
    selectedContacts.forEach(contact => {
      setSubscribers(prev => [
        ...prev,
        {number: '+1'.concat(contact), verified: false, new: true},
      ]);
    });

    closePopup();
  };

  const removeSubscriber = index => {
    const temp = subscribers;
    temp.splice(index, 1);
    setSubscribers(prev => [...temp]);
  };

  const handleCreateRoute = () => {
    const formattedSubscribers = subscribers.map(sub => JSON.stringify(sub));
    setLoading(true);
    fetch(`${DEV_URL}/api/v1/routes/create`, {
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
      }),
    })
      .then(res => res.json())
      .then(async data => {
        if (data.status === 201) {
          navigation.navigate('Routes', {
            update: uuid(),
            createdRoute: 'success',
            updatedRoute: '',
            deletedRoute: '',
          });
        } else {
          console.log('DATA: ', data);
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
  };

  //maybe put this logic in the app component and cache the res
  //i have never cached before so maybe we will be able to cache here
  //could use a useMemo hook as well
  useEffect(() => {
    if (Platform.OS === 'ios') {
      request(PERMISSIONS.IOS.CONTACTS).then(result => {
        if (result === 'granted') {
          Contacts.getAll()
            .then(data => setContacts(data))
            .catch(err => console.log('Unable to get contacts'));
        }
      });
    } else {
      request(PERMISSIONS.ANDROID.READ_CONTACTS).then(result => {
        if (result === 'granted') {
          Contacts.getAll()
            .then(data => setContacts(data))
            .catch(err => console.log('Unable to get contacts'));
        }
      });
    }
  }, []);

  const data = [
    {key: '1', value: '5m'},
    {key: '2', value: '10m'},
    {key: '3', value: '20m'},
    {key: '4', value: '30m'},
    {key: '5', value: '60m'},
  ];

  const openPopup = (text, background, subtext, error) => {
    setPopupText(text);
    setPopupBackground(background);
    setSubtext(subtext);

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
  };

  return (
    <>
      {true ? (
        <>
          <Animated.View
            style={{
              transform: [{translateY: popupY}],
              zIndex: 1,
            }}>
            <Modal
              background={'white'}
              closeModal={closePopup}
              onClick={handleAddSubscribers}
              list={contacts}
              subscribers={subscribers}>
              Contacts
            </Modal>
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
          <ScrollView
            contentContainerStyle={styles.containerStyle}
            scrollEnabled={true}>
            <Text style={styles.headerTextStyles}>New Route</Text>
            <View style={styles.inputsStyles}>
              <TextInput
                style={styles.inputStyles}
                placeholder="Route name"
                value={name}
                onChangeText={e => setName(e.valueOf())}
              />
              <TextInput
                style={styles.inputStyles}
                placeholder="Destination address"
                value={destination}
                onChangeText={e => setDestination(e.valueOf())}
              />
              <SelectList
                setSelected={val => setInterval(val)}
                data={data}
                save="value"
                placeholder="Interval"
                searchPlaceholder="Interval"
                dropdownTextStyles={{fontSize: 16}}
                inputStyles={{
                  fontSize: 20,
                }}
              />
              {/* <View
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
              </View> */}
              <View
                style={{
                  flexDirection: 'row',
                  width: width - 40,
                  gap: 10,
                }}>
                <TouchableOpacity
                  style={{
                    ...styles.buttonStyles,
                    backgroundColor:
                      subscribers.length >= 5 ? 'rgba(0, 0, 0, .2)' : '#1e90ff',
                    borderWidth: 1,
                    borderColor: '#1e90ff',
                  }}
                  onPress={openPopup}
                  disabled={subscribers.length >= 5 ? true : false}>
                  <Text style={{...styles.buttonTextStyles, color: 'white'}}>
                    Add subscribers
                  </Text>
                </TouchableOpacity>
              </View>
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
                      ) : (
                        <Icon
                          name="checkmark-circle-outline"
                          size={25}
                          color="#1bab05"
                        />
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => removeSubscriber(index)}>
                      <Icon name="trash" size={25} color={'#de3623'} />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={{textAlign: 'center'}}>No subscribers yet</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.buttonStyles}
              onPress={handleCreateRoute}>
              {!loading ? (
                <Text style={styles.buttonTextStyles}>Create</Text>
              ) : (
                <ActivityIndicator size="small" color="#0000ff" />
              )}
            </TouchableOpacity>
          </ScrollView>
        </>
      ) : (
        <View style={styles.containerStyle}>
          <ActivityIndicator size="small" color="#0000ff" />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  containerStyle: {
    height: height,
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
    color: '#de3623',
  },
  buttonStyles: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'pink',
    width: width - 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#de3623',
    borderWidth: 1,
  },
  inputsStyles: {
    backgroundColor: 'white',
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
