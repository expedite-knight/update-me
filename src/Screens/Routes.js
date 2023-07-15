import React, {useEffect, useState, useContext} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Dimensions,
  PermissionsAndroid,
} from 'react-native';
import {UserContext} from '../../UserContext';
import {STORE_KEY, APP_URL} from '@env';
import RouteCard from '../Components/RouteCard';
import {useNavigation} from '@react-navigation/native';
import {TouchableOpacity} from 'react-native-gesture-handler';
import Navbar from '../Components/Navbar';
import BackgroundService from 'react-native-background-actions';
import Geolocation from 'react-native-geolocation-service';
import moment from 'moment';
import "react-native-get-random-values";
import uuid from 'react-uuid'

const {width, height} = Dimensions.get('screen');

//disable the create route button if a user has 5 routes or more
//this will only be for actual subscribers
const Routes = ({route}) => {
  const nav = useNavigation();
  const [jwt, setJwt, handleStoreToken] = useContext(UserContext);
  const [routes, setRoutes] = useState([]);
  const update = route?.params?.update;

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

  useEffect(() => {

    if (jwt) {
      fetch(`${APP_URL}/api/v1/users/routes`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: jwt,
          'User-Agent': 'any-name',
        },
        mode: 'cors',
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === 200) {
            setRoutes(data.routes);
          } else {
            console.log(
              'STATUS:',
              data.status,
              'with error:',
              data.body.message,
            );
            handleStoreToken('');
            nav.navigate('Login');
          }
        })
        .catch(error => {
          console.log('error getting routes:', error);
        });
    } else {
      console.log('User not logged in.');
      nav.navigate('Login');
    }
  }, [jwt, update]);

  return (
    <View style={styles.containerStyle}>
      <TouchableOpacity
        style={styles.mainButton}
        onPress={() => nav.navigate('CreateRoute', {update: uuid()})}>
        <Text style={styles.buttonTextStyles}>Create Route</Text>
      </TouchableOpacity>
      <View style={{...styles.contentStyles}}>
        {routes.map(route => {
          return (
            <RouteCard
              id={route._id}
              key={route._id}
              routeName={route.routeName}
              jwt={jwt}
              active={route.active}
            />
          );
        })}
      </View>
      <Navbar handleLogout={handleLogout} />
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
    display: 'flex',
    overflow: 'visible',
    alignItems: 'center',
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
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#1bab05',
    elevation: 10,
    borderRadius: 20,
    height: 65,
    width: width - 100,
    overflow: 'visible',
  },
});

export default Routes;
