import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Pressable,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import {useState, useEffect, useContext} from 'react';
import {STORE_KEY, APP_URL, DEV_URL} from '@env';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome5';
import Geolocation from 'react-native-geolocation-service';
import uuid from 'react-uuid';
import {
  PERMISSIONS,
  request,
  check,
  openSettings,
} from 'react-native-permissions';

const {width, height} = Dimensions.get('screen');

const RouteCard = props => {
  const [active, setActive] = useState(props.active);
  const [paused, setPaused] = useState(props.paused | false);
  const [error, setError] = useState('');
  const nav = useNavigation();

  const renderPauseButton = (progress, dragX) => {
    return (
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
        }}>
        <TouchableOpacity
          style={{
            ...styles.deleteButton,
            backgroundColor: paused ? 'gainsboro' : '#FFE992',
          }}
          disabled={!active ? true : false}
          onPress={active ? (paused ? handleUnpause : handlePauseRoute) : null}>
          <Ionicons
            name={paused ? 'play' : 'pause'}
            size={25}
            color={paused ? 'gray' : '#FFC30B'}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderDeleteButton = (progress, dragX) => {
    return (
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <TouchableOpacity
          style={{
            ...styles.deleteButton,
            backgroundColor: active ? 'gainsboro' : 'pink',
          }}
          disabled={active ? true : false}
          onPress={!active ? handleDeleteRoute : null}>
          <Ionicons
            name="trash"
            size={25}
            color={active ? 'gray' : '#de3623'}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const sendActiveLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        fetch(`${APP_URL}/api/v1/routes/activate`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: props.jwt,
            'User-Agent': 'any-name',
          },
          mode: 'cors',
          body: JSON.stringify({
            route: props.id,
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
              props.openPopup('Route activated successfully', '#1e90ff');
              setTimeout(() => {
                props.closePopup();
              }, 3000);
            } else if (data.status === 409) {
              setActive(false);
              props.openPopup(
                'Another route is already active, would you like to override it?',
                'white',
                true,
                props.id,
              );
            } else {
              setActive(false);
              props.openPopup('Unable to activate route', '#DC143C');
              setTimeout(() => {
                props.closePopup();
              }, 3000);
            }
          })
          .catch(error => {
            console.log('ERROR:', error);
            setActive(false);
            props.openPopup('Unable to activate route', '#DC143C');
            setTimeout(() => {
              props.closePopup();
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
    e.stopPropagation();
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
            Authorization: props.jwt,
            'User-Agent': 'any-name',
          },
          mode: 'cors',
          body: JSON.stringify({
            route: props.id,
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
              props.openPopup('Unable to deactive route', '#DC143C');
              setTimeout(() => {
                props.closePopup();
              }, 3000);
            } else {
              props.updateRoutes();
              props.openPopup('Route deactivated successfully', '#1e90ff');
              setTimeout(() => {
                props.closePopup();
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
    e.stopPropagation();
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

  const sendPausedLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        fetch(`${APP_URL}/api/v1/routes/pause`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: props.jwt,
            'User-Agent': 'any-name',
          },
          mode: 'cors',
          body: JSON.stringify({
            route: props.id,
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
              props.openPopup('Unable to pause route', '#DC143C');
              setTimeout(() => {
                props.closePopup();
              }, 3000);
            } else {
              props.updateRoutes();
              props.openPopup('Route paused successfully', '#1e90ff');
              setTimeout(() => {
                props.closePopup();
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

  const handlePauseRoute = async e => {
    e.stopPropagation();
    setPaused(true);

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
          sendPausedLocation();
        } else {
          console.log('Permission not granted');
          setPaused(false);
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
          sendPausedLocation();
        } else {
          console.log('Permission not granted');
          setPaused(false);
        }
      }
    } catch (err) {
      console.log('Err: ', err);
      setPaused(false);
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
            Authorization: props.jwt,
            'User-Agent': 'any-name',
          },
          mode: 'cors',
          body: JSON.stringify({
            route: props.id,
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
              props.openPopup('Unable to unpause route', '#DC143C');
              setTimeout(() => {
                props.closePopup();
              }, 3000);
            } else {
              props.updateRoutes();
              props.openPopup('Route unpaused successfully', '#1e90ff');
              setTimeout(() => {
                props.closePopup();
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

  const handleUnpause = async e => {
    e.stopPropagation();
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

  function handleDeleteRoute() {
    fetch(`${APP_URL}/api/v1/routes/delete`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: props.jwt,
        'User-Agent': 'any-name',
      },
      body: JSON.stringify({
        route: props.id,
      }),
      mode: 'cors',
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 204) {
          nav.navigate('Routes', {
            update: uuid(),
            updatedRoute: '',
            createdRoute: '',
            deletedRoute: 'success',
          });
        } else {
          setError(data.body.error[0]);
        }
      })
      .catch(error => {
        console.log('ERROR:', error[0]);
      });
  }

  return (
    <Swipeable
      renderRightActions={() =>
        active ? (paused ? null : renderPauseButton()) : renderDeleteButton()
      }
      containerStyle={{
        overflow: 'visible',
      }}>
      <TouchableOpacity
        style={styles.container}
        onPress={() => nav.navigate('RouteDetails', {routeId: props.id})}>
        <View style={{gap: 5}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
            <Text
              numberOfLines={1}
              style={{
                fontWeight: '400',
                fontSize: 20,
                color: 'black',
                maxWidth: width - 100,
              }}>
              {props.routeName}
            </Text>
            {false ? (
              <View
                style={{
                  backgroundColor: '#FFE992',
                  borderRadius: 10,
                  height: 10,
                  width: 10,
                }}></View>
            ) : null}
          </View>
          <Text
            numberOfLines={1}
            style={{
              fontWeight: '400',
              fontSize: 15,
              color: 'gray',
              maxWidth: width - 100,
            }}>
            {props.destination}
          </Text>
        </View>
        <View>
          <TouchableOpacity
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: active
                ? paused
                  ? '#FFE992'
                  : '#AFE1AF'
                : 'gainsboro',
              width: 50,
              height: 50,
              borderRadius: 50,
            }}
            onPress={
              active
                ? paused
                  ? handleUnpause
                  : handleDeactivation
                : handleActivation
            }>
            {props.quickRoute ? (
              <FontAwesome
                name={paused ? 'play' : 'fire'}
                size={paused ? 25 : 30}
                color={active ? (paused ? '#FFC30B' : '#03c04a') : 'gray'}
              />
            ) : (
              <Ionicons
                name={paused ? 'play' : 'power'}
                size={30}
                color={active ? (paused ? '#FFC30B' : '#03c04a') : 'gray'}
              />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    width: width - 40,
    overflow: 'visible',
    borderBottomWidth: 1,
    borderBottomColor: 'gainsboro',
    paddingVertical: 20,
  },
  content: {},
  controls: {},
  deleteButton: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'pink',
    borderRadius: 75,
    height: 50,
    width: 50,
    marginLeft: 20,
  },
});

export default RouteCard;
