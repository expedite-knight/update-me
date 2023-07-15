import React, {useState, useEffect, useContext} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  TouchableOpacity,
  PermissionsAndroid,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import BackgroundService from 'react-native-background-actions';
import Geolocation from 'react-native-geolocation-service';
import moment from 'moment';
import {STORE_KEY, APP_URL} from '@env';
import {UserContext} from '../../UserContext';
import Navbar from '../Components/Navbar';

const Home = () => {
  const nav = useNavigation();
  const [jwt, setJwt, handleStoreToken, handleFetchToken] =
    useContext(UserContext);

  useEffect(() => {
    if (!jwt) {
      console.log('User not logged in.');
      nav.navigate('Login');
    } else {
      if (!BackgroundService.isRunning()) handleStartTask();
    }
  }, []);

  //---------put this in a custom hook? OR its own module---------

  //this whole thing works but now you just need to start this task
  //when the user logins in and send the users updated location
  ///to the backend via post request
  const sleep = time =>
    new Promise(resolve => setTimeout(() => resolve(), time));

  //run this task when component mounts
  const veryIntensiveTask = async taskDataArguments => {
    try {
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
          message:
            'Can we access your location while the app is in the background? This is essential for the apps functionality.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (backPerm === 'granted' && frontPerm == 'granted') {
        console.log('You can use Geolocation');
        const {delay} = taskDataArguments;
        await new Promise(async resolve => {
          for (let i = 0; BackgroundService.isRunning(); i++) {
            Geolocation.getCurrentPosition(
              position => {
                const date = new Date(position.timestamp);
                fetch(`${APP_URL}/api/v1/users/location/update`, {
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
                    lat: position.coords.latitude,
                    long: position.coords.longitude,
                  }),
                })
                  .then(res => res.json())
                  .then(async data => {
                    if (data.status === 200) {
                      console.log(
                        'Location updated at: ',
                        moment(date).format('LTS'),
                      );
                    } else {
                      console.log('User has logged out...');
                      handleLogout();
                    }
                  })
                  .catch(error => {
                    console.log('Unable to update location with ERROR:', error);
                  });
              },
              error => {
                console.log(error.code, error.message);
              },
              {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
            );

            await sleep(delay);
          }
        });
      } else {
        console.log('You cannot use Geolocation');
      }
    } catch (err) {
      console.log(err);
    }
  };

  const options = {
    taskName: 'Example',
    taskTitle: 'ExampleTask title',
    taskDesc: 'ExampleTask description',
    taskIcon: {
      name: 'ic_launcher',
      type: 'mipmap',
    },
    color: '#ff00ff',
    linkingURI: 'yourSchemeHere://chat/jane', // See Deep Linking for more info
    parameters: {
      delay: 1000 * 60, //1000 * 60 = every minute (change this to every 10 sec?)
    },
  };

  const handleStartTask = async () => {
    console.log('Tracking location...');
    if (BackgroundService.isRunning()) {
      console.log('Already tracking location...');
    } else {
      await BackgroundService.start(veryIntensiveTask, options);
    }
  };

  const handleStopTask = async () => {
    console.log('Stopping tracking service...');
    await BackgroundService.stop();
  };
  //--------------------------------------------------------------

  //this is where logout happens
  async function handleLogout() {
    handleStoreToken('');
    await handleStopTask();
    nav.navigate('Login');
  }

  return (
    <View style={styles.containerStyle}>
      <View style={styles.contentStyles}>
        <TouchableOpacity style={styles.buttonStyles} onPress={handleStartTask}>
          <Text style={styles.buttonTextStyles}>Start task</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonStyles} onPress={handleStopTask}>
          <Text style={styles.buttonTextStyles}>Stop task</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonStyles}>
          <Text
            style={styles.buttonTextStyles}
            onPress={() => nav.navigate('Routes')}>
            To Routes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonStyles} onPress={handleLogout}>
          <Text style={styles.buttonTextStyles}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerStyle: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    gap: 20,
    padding: 20,
  },
  contentStyles: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  headerTextStyles: {
    fontSize: 30,
    fontWeight: '500',
  },
  buttonTextStyles: {
    fontSize: 20,
    fontWeight: '500',
    color: 'white',
  },
  buttonStyles: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgb(120,150, 250)',
  },
  secondaryTextStyles: {
    fontSize: 20,
    fontWeight: '500',
    color: 'black',
  },
});

export default Home;
