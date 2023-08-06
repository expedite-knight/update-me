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
  Platform,
} from 'react-native';
import {UserContext} from '../../UserContext';
import {STORE_KEY, APP_URL, DEV_URL} from '@env';
import RouteCard from '../Components/RouteCard';
import {TouchableOpacity} from 'react-native-gesture-handler';
import BackgroundService from 'react-native-background-actions';
import Geolocation from 'react-native-geolocation-service';
import moment from 'moment';
import 'react-native-get-random-values';
import uuid from 'react-uuid';
import Popup from '../Components/Popup';
import {
  PERMISSIONS,
  request,
  check,
  openSettings,
} from 'react-native-permissions';

const {width, height} = Dimensions.get('screen');

const Routes = ({route, navigation, isAuthorized}) => {
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
      handleStopTask();
      navigation ? navigation.navigate('Login') : null;
    } else {
      if (!BackgroundService.isRunning()) handleStartTask();
    }
    setUpdate(route?.params?.update);

    if (route?.params?.createdRoute === 'success') {
      openPopup('Route created successfully', '#1e90ff');
      route.params = {};
      setTimeout(() => {
        closePopup();
      }, 3000);
    }
    if (route?.params?.updatedRoute === 'success') {
      openPopup('Route updated successfully', '#1e90ff');
      route.params = {};
      setTimeout(() => {
        closePopup();
      }, 3000);
    }
    if (route?.params?.deletedRoute === 'success') {
      openPopup('Route deleted successfully', '#1e90ff');
      route.params = {};
      setTimeout(() => {
        closePopup();
      }, 3000);
    }
  }, [route?.params]);

  //---------put this in a custom hook? OR its own module---------
  const sleep = time =>
    new Promise(resolve => setTimeout(() => resolve(), time));

  const veryIntensiveTask = async taskDataArguments => {
    if (Platform.OS === 'android') {
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
                      console.log(
                        'Unable to update location with ERROR:',
                        error,
                      );
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
    } else {
      try {
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
                      console.log(
                        'Unable to update location with ERROR:',
                        error,
                      );
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
        console.log('ERR sending location: ', err);
      }
      //now send the users location to the server by starting the task
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

  //for some reason this func is getting called a few times on render(sometimes)
  //fix it by adding async await to the functions that start and stop it
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
    navigation.navigate('Login');
  }

  async function handleRouteOverride() {
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
            setLoading(false);
          } else {
            console.log(
              'STATUS:',
              data.status,
              'with error:',
              data.body.message,
            );
            handleStoreToken('');
            navigation.navigate('Login');
          }
        })
        .catch(error => {
          console.log('error getting routes:', error);
        });
    } else {
      handleStopTask();
      navigation ? navigation.navigate('Login') : null;
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
        {loading ? (
          <View style={styles.containerStyle}>
            <ActivityIndicator size="small" color="black" />
          </View>
        ) : (
          <View
            style={{
              ...styles.contentStyles,
            }}>
            {routes.length > 0 ? (
              routes.map(route => {
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
                    destination={route.destination}
                  />
                );
              })
            ) : (
              <Text style={{color: 'gray'}}>You dont have any routes</Text>
            )}
          </View>
        )}
      </ScrollView>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'flex-end',
          padding: 20,
        }}>
        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => navigation.push('CreateRoute')}>
          <Text style={{color: 'white', fontSize: 30}}>+</Text>
        </TouchableOpacity>
      </View>
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
    display: 'flex',
    overflow: 'visible',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e90ff',
    borderRadius: 50,
    height: 65,
    width: 65,
    elevation: 5,
    shadowColor: 'gray',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
});

export default Routes;
