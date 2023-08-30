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
  RefreshControl,
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
import {useFocusEffect} from '@react-navigation/native';

const {width, height} = Dimensions.get('screen');

const Routes = ({route, navigation, isAuthorized}) => {
  const [jwt, setJwt, handleStoreToken, handleFetchToken, verifyRefreshToken] =
    useContext(UserContext);
  let accessToken = jwt;
  const [routesElement, setRoutesElement] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [update, setUpdate] = useState(route?.params?.update);
  const [loading, setLoading] = useState(false);
  const [popupY, setPopupY] = useState(new Animated.Value(-height));
  const [popupText, setPopupText] = useState('');
  const [popupBackground, setPopupBackground] = useState('#1e90ff');
  const [isPopupPrompt, setIsPopupPrompt] = useState(false);
  const [overrideId, setOverrideId] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setUpdate(uuid());

      return () => {
        navigation.setParams({
          createdRoute: '',
          updatedRoute: '',
          deletedRoute: '',
        });
      };
    }, []),
  );

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
    const asyncStartTask = async () => {
      await handleStartTask();
    };

    if (!accessToken) {
      console.log('User not logged in.');
      handleStopTask();
      navigation ? navigation.navigate('Login') : null;
    } else {
      if (!BackgroundService.isRunning()) {
        asyncStartTask();
      }
    }
    setUpdate(route?.params?.update);

    if (route?.params?.createdRoute === 'success') {
      openPopup('Route created successfully', '#1e90ff');
      setTimeout(() => {
        closePopup();
      }, 3000);
    }
    if (route?.params?.updatedRoute === 'success') {
      openPopup('Route updated successfully', '#1e90ff');
      setTimeout(() => {
        closePopup();
      }, 3000);
    }
    if (route?.params?.deletedRoute === 'success') {
      openPopup('Route deleted successfully', '#1e90ff');
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
                      Authorization: accessToken,
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
                        handleFetchRoutes(accessToken);
                      } else if (data.status == 401) {
                        const refreshToken = await handleFetchToken('refresh');

                        if (refreshToken) {
                          const replacementToken = await verifyRefreshToken(
                            refreshToken,
                          );
                          if (replacementToken) {
                            accessToken = replacementToken;
                            handleFetchRoutes(replacementToken);
                          } else {
                            handleStopTask();
                            handleLogout();
                          }
                        } else {
                          console.log('User not logged in...');
                          handleStopTask();
                          handleLogout();
                        }
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
          const {delay} = taskDataArguments;
          await new Promise(async resolve => {
            for (let i = 0; BackgroundService.isRunning(); i++) {
              Geolocation.getCurrentPosition(
                position => {
                  console.log('sending location with token: ', accessToken);
                  const date = new Date(position.timestamp);
                  fetch(`${APP_URL}/api/v1/users/location/update`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                      Accept: 'application/json',
                      'Content-Type': 'application/json',
                      Authorization: accessToken,
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
                        handleFetchRoutes(accessToken);
                      } else if (data.status == 401) {
                        const refreshToken = await handleFetchToken('refresh');

                        if (refreshToken) {
                          const replacementToken = await verifyRefreshToken(
                            refreshToken,
                          );
                          if (replacementToken) {
                            accessToken = replacementToken;
                            console.log(
                              'Fetching routes with replacement token: ',
                            );
                            handleFetchRoutes(replacementToken, true);
                          } else handleStopTask();
                        } else {
                          console.log('User not logged in...');
                          handleStopTask();
                          handleLogout();
                          navigation ? navigation.navigate('Login') : null;
                        }
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
    if (BackgroundService.isRunning()) {
      console.log('Already tracking location...');
    } else {
      console.log('Starting task');
      await BackgroundService.start(veryIntensiveTask, options);
    }
  };

  const handleStopTask = async () => {
    console.log('Stopping tracking service...');
    await BackgroundService.stop();
  };
  //--------------------------------------------------------------

  async function handleLogout() {
    handleStoreToken('', 'jwt');
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
            Authorization: accessToken,
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
                openPopup('Unable to override route', '#DC143C');
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

  async function handleFetchRoutes(token, replacementUsed) {
    setRefreshing(true);
    if (token) {
      fetch(`${APP_URL}/api/v1/users/routes`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: token,
          'User-Agent': 'any-name',
        },
        mode: 'cors',
      })
        .then(res => res.json())
        .then(async data => {
          if (data.status === 200) {
            setRoutes(() => [...data.routes]);
            setRefreshing(false);
            if (replacementUsed) {
              //token not being updated so maybe stopping the task and starting
              //again will help update the token
              // await handleStopTask();
              // await handleStartTask();
              //not sure if the above works, try putting the token in a regular
              //let variable and try to update that
            }
          } else {
            console.log('STATUS:', data.status, 'with error:', data);
          }
        })
        .catch(error => {
          console.log('error getting routes:', error);
        });
    } else {
      await handleStopTask();
      navigation ? navigation.navigate('Login') : null;
    }
  }

  useEffect(() => {
    setRoutesElement(() => {
      return routes.map(route => {
        return (
          <RouteCard
            id={route._id}
            key={route._id}
            routeName={route.routeName}
            jwt={accessToken}
            active={route.active}
            toggleUpdate={uuid => setUpdate(uuid)}
            openPopup={openPopup}
            closePopup={closePopup}
            destination={route.destination}
          />
        );
      });
    });
  }, [routes, update, accessToken]);

  //we have to put it in here and activate it from here
  useEffect(() => {
    handleFetchRoutes(accessToken);
  }, [accessToken, update]);

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
        scrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => handleFetchRoutes(accessToken)}
          />
        }>
        <View
          style={{
            ...styles.contentStyles,
          }}>
          {routesElement.length > 0 ? (
            routesElement
          ) : (
            <Text>You dont have any routes yet</Text>
          )}
        </View>
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
    backgroundColor: 'black',
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
