import React, {useEffect, useState, useContext} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
  PermissionsAndroid,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {UserContext} from '../../UserContext';
import {STORE_KEY, APP_URL, DEV_URL} from '@env';
import RouteCard from '../Components/RouteCard';
import {useNavigation} from '@react-navigation/native';
import {TouchableOpacity} from 'react-native-gesture-handler';
import Navbar from '../Components/Navbar';
import BackgroundService from 'react-native-background-actions';
import Geolocation from 'react-native-geolocation-service';
import moment from 'moment';
import 'react-native-get-random-values';
import uuid from 'react-uuid';
import Popup from '../Components/Popup';

const {width, height} = Dimensions.get('screen');

//also alert the user if a number has not been verified yet
//maybe use the verified numbers object when showing subscribers
//and not just a string, that way it will be easy to tell if a number has
//been verified yet or not and display that on the app/frontend
const Routes = ({route}) => {
  const nav = useNavigation();
  const [jwt, setJwt, handleStoreToken] = useContext(UserContext);
  const [routes, setRoutes] = useState([]);
  const [update, setUpdate] = useState(route?.params?.update);
  const [loading, setLoading] = useState(false);
  const [popupY, setPopupY] = useState(new Animated.Value(-height));
  const [popupText, setPopupText] = useState('');
  const [popupBackground, setPopupBackground] = useState('#1e90ff');
  const [isPopupPrompt, setIsPopupPrompt] = useState(false);
  const [overrideId, setOverrideId] = useState('');

  const openPopup = (text, background, prompt, routeId) => {
    setPopupText(text);
    setPopupBackground(background);
    setIsPopupPrompt(prompt);
    setOverrideId(routeId);

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
    if (!jwt) {
      console.log('User not logged in.');
      nav.navigate('Login');
    } else {
      if (!BackgroundService.isRunning()) handleStartTask();
    }
    setUpdate(route?.params?.update);
  }, [route.params]);

  //---------put this in a custom hook? OR its own module---------
  const sleep = time =>
    new Promise(resolve => setTimeout(() => resolve(), time));

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
                fetch(`${DEV_URL}/api/v1/users/location/update`, {
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
                    offset: new Date().getTimezoneOffset() / 60,
                  }),
                })
                  .then(res => res.json())
                  .then(async data => {
                    if (data.status === 204) {
                      console.log(
                        'Location updated at: ',
                        moment(date).format('LTS'),
                      );
                    } else if (data.status === 403) {
                      console.log('User has logged out...');
                      handleLogout();
                    } else if (data.status === 200) {
                      setUpdate(uuid());
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

  async function handleLogout() {
    handleStoreToken('');
    await handleStopTask();
    nav.navigate('Login');
  }

  async function handleRouteOverride() {
    Geolocation.getCurrentPosition(
      position => {
        const date = new Date(position.timestamp);
        fetch(`${DEV_URL}/api/v1/routes/activate/override`, {
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
            route: overrideId,
            currentLocation: {
              lat: position.coords.latitude,
              long: position.coords.longitude,
            },
            offset: new Date().getTimezoneOffset() / 60,
          }),
        })
          .then(res => res.json())
          .then(async data => {
            if (data.status === 200) {
              closePopup();
              setTimeout(() => {
                setUpdate(uuid());
              }, 500);
            } else {
              closePopup();
              setTimeout(() => {
                openPopup('Unable to override route', 'red');
              }, 1000);
              setTimeout(() => {
                closePopup();
              }, 4000);
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
  }

  useEffect(() => {
    setLoading(true);
    if (jwt) {
      fetch(`${DEV_URL}/api/v1/users/routes`, {
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
            setLoading(false);
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
    <>
      <Animated.View
        style={{
          transform: [{translateY: popupY}],
          zIndex: 1,
        }}>
        <Popup
          background={popupBackground}
          prompt={isPopupPrompt}
          closePopup={closePopup}
          handleRouteOverride={handleRouteOverride}>
          {popupText}
        </Popup>
      </Animated.View>
      <ScrollView
        contentContainerStyle={styles.containerStyle}
        scrollEnabled={true}>
        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => nav.navigate('CreateRoute')}>
          <Text style={styles.buttonTextStyles}>Create Route</Text>
        </TouchableOpacity>
        {loading ? (
          <View style={styles.containerStyle}>
            <ActivityIndicator size="small" color="#0000ff" />
          </View>
        ) : (
          <View style={{...styles.contentStyles}}>
            {routes.map(route => {
              return (
                <RouteCard
                  id={route._id}
                  key={route._id}
                  routeName={route.routeName}
                  jwt={jwt}
                  active={route.active}
                  toggleUpdate={uuid => setUpdate(uuid)}
                  openPopup={openPopup}
                  closePopup={closePopup}
                />
              );
            })}
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
    backgroundColor: 'white',
    gap: 20,
    padding: 20,
    position: 'relative',
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
    borderRadius: 20,
    height: 65,
    width: width - 40,
    overflow: 'visible',
  },
});

export default Routes;
