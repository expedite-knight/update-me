import React, {useState, useContext, useEffect} from 'react';
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
import Foundation from 'react-native-vector-icons/Foundation';
import {UserContext} from '../../UserContext';
import {STORE_KEY, APP_URL, DEV_URL} from '@env';
import {useNavigation} from '@react-navigation/native';
import uuid from 'react-uuid';
import {SelectList} from 'react-native-dropdown-select-list';

const {width, height} = Dimensions.get('screen');

const RouteDetails = ({route, navigation}) => {
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [interval, setInterval] = useState('');
  const [subscribers, setSubscribers] = useState([]);
  const [subscriber, setSubscriber] = useState('');
  const [error, setError] = useState('');
  const [jwt, setJwt, handleStoreToken, handleFetchToken] =
    useContext(UserContext);
  const nav = useNavigation();
  const {routeId} = route.params;
  const [loading, setLoading] = useState(true);

  const handleAddSubscriber = () => {
    if (subscribers.length < 5 && subscriber.trim().length === 10) {
      setSubscribers(prev => [
        ...prev,
        {number: '+1'.concat(subscriber), verified: true, new: true},
      ]);
      setSubscriber('');
    } else if (
      subscribers.length < 5 &&
      subscriber.trim().length === 11 &&
      subscriber.indexOf(1) === 0
    ) {
      setSubscribers(prev => [
        ...prev,
        {number: '+'.concat(subscriber), verified: true, new: true},
      ]);
      setSubscriber('');
    }
  };

  const removeSubscriber = index => {
    const temp = subscribers;
    temp.splice(index, 1);
    setSubscribers(prev => [...temp]);
  };

  useEffect(() => {
    if (jwt) {
      fetch(`${DEV_URL}/api/v1/routes/details`, {
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
            setSubscribers([...data.body.message.subscribers]);
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
      nav.navigate('Login');
    }
  }, [jwt]);

  function handleUpdateRoute() {
    fetch(`${DEV_URL}/api/v1/routes/update`, {
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
        subscribers: subscribers,
        name: name,
        interval: interval,
      }),
      mode: 'cors',
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 204) {
          nav.navigate('Routes', {update: uuid()});
        } else {
          setError(data.body.error[0]);
        }
      })
      .catch(error => {
        console.log('ERROR:', error[0]);
      });
  }

  function handleDeleteRoute() {
    fetch(`${DEV_URL}/api/v1/routes/delete`, {
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
          nav.navigate('Routes', {update: uuid()});
        } else {
          setError(data.body.error[0]);
        }
      })
      .catch(error => {
        console.log('ERROR:', error[0]);
      });
  }

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
          <View style={{alignItems: 'center', gap: 10}}>
            <Text style={styles.headerTextStyles}>Route:</Text>
            <Text>{routeId}</Text>
          </View>
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
              enabled={false}
              editable={false}
            />
            <SelectList
              setSelected={val => setInterval(val)}
              data={data}
              save="value"
              placeholder={interval === 1 ? '1h' : interval.concat('m')}
              searchPlaceholder="Interval"
              dropdownTextStyles={{fontSize: 20}}
              inputStyles={{
                fontSize: 20,
              }}
            />
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
                <View
                  style={{flexDirection: 'row', gap: 10, alignItems: 'center'}}>
                  <Text
                    style={{
                      fontSize: 20,
                      color: value.new ? '#1bab05' : 'black',
                    }}>
                    {value.number}
                  </Text>
                  {!value.verified && (
                    <Icon
                      name="alert-circle-outline"
                      size={25}
                      color={'#de3623'}
                    />
                  )}
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeSubscriber(index)}>
                  <Icon name="trash" size={25} color={'gray'} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={{gap: 10}}>
            <TouchableOpacity
              style={styles.buttonStyles}
              onPress={handleUpdateRoute}>
              <Text style={styles.buttonTextStyles}>Update</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{...styles.buttonStyles, backgroundColor: 'red'}}
              onPress={handleDeleteRoute}>
              <Text style={styles.buttonTextStyles}>Delete</Text>
            </TouchableOpacity>
          </View>
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

export default RouteDetails;
