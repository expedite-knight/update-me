import React, {useState, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
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
import {useNavigation} from '@react-navigation/native';
import uuid from 'react-uuid';
import {SelectList} from 'react-native-dropdown-select-list';
import DropDownPicker from 'react-native-dropdown-picker';

const {width, height} = Dimensions.get('screen');

const CreateRoute = () => {
  const [quickRoute, setQuickRoute] = useState(false);
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [interval, setInterval] = useState('');
  const [subscribers, setSubscribers] = useState([]);
  const [subscriber, setSubscriber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [jwt, setJwt, handleStoreToken, handleFetchToken] =
    useContext(UserContext);
  const nav = useNavigation();

  const handleAddSubscriber = () => {
    if (subscribers.length < 5 && subscriber.trim().length >= 10) {
      setSubscribers(prev => [...prev, subscriber]);
      setSubscriber('');
    }
  };

  const removeSubscriber = index => {
    const temp = subscribers;
    temp.splice(index, 1);
    setSubscribers(prev => [...temp]);
  };

  const handleCreateRoute = () => {
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
        subscribers: subscribers,
      }),
    })
      .then(res => res.json())
      .then(async data => {
        console.log('Created route successfully');
        nav.navigate('Routes', {update: uuid()});
      })
      .catch(error => {
        console.log('Unable to create route:', error);
      });
  };

  const data = [
    {key: '1', value: '5m'},
    {key: '2', value: '10m'},
    {key: '3', value: '20m'},
    {key: '4', value: '30m'},
    {key: '5', value: '1h'},
  ];

  return (
    <>
      {!loading ? (
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
              dropdownTextStyles={{fontSize: 20}}
              inputStyles={{
                fontSize: 20,
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <CheckBox
                disabled={false}
                value={quickRoute}
                onValueChange={value => setQuickRoute(value)}
              />
              <Text style={{fontSize: 15}}>Quick Route</Text>
            </View>
            {/* <Text style={{textAlign: 'center', fontSize: 20}}>Subscribers</Text> */}
            <View
              style={{
                flexDirection: 'row',
                width: width - 40,
                gap: 10,
              }}>
              <TextInput
                style={{...styles.inputStyles, flex: 1}}
                placeholder="Subscriber"
                value={subscriber}
                onChangeText={e => setSubscriber(e.valueOf())}
              />
              <TouchableOpacity
                style={{
                  ...styles.buttonStyles,
                  backgroundColor:
                    subscribers.length >= 5 ? 'rgba(0,0,0,.5)' : 'black',
                  width: 100,
                }}
                onPress={handleAddSubscriber}
                disabled={subscribers.length >= 5 ? true : false}>
                <Text style={{...styles.buttonTextStyles}}>Add</Text>
              </TouchableOpacity>
            </View>
            {subscribers.map((value, index) => (
              <View key={index} index={index} style={styles.subscriber}>
                <Text style={{fontSize: 20}}>{value}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeSubscriber(index)}>
                  <Icon name="trash" size={25} color={'#de3623'} />
                </TouchableOpacity>
              </View>
            ))}
            {/*make an according drop down thing instead and when it isnt toggled
        just show the last or first number added*/}
          </View>
          <TouchableOpacity
            style={styles.buttonStyles}
            onPress={handleCreateRoute}>
            <Text style={styles.buttonTextStyles}>Create</Text>
          </TouchableOpacity>
        </ScrollView>
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
    color: 'white',
  },
  buttonStyles: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1bab05',
    width: width - 40,
    justifyContent: 'center',
    alignItems: 'center',
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
