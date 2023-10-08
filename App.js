import {SafeAreaProvider} from 'react-native-safe-area-context';
import 'react-native-gesture-handler';
import React, {useState, useEffect} from 'react';
import {Platform, Image} from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  useNavigation,
} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Login from './src/Screens/Login';
import Routes from './src/Screens/Routes';
import {UserContext} from './UserContext';
import RNSecureStorage, {ACCESSIBLE} from 'rn-secure-storage';
import EncryptedStorage from 'react-native-encrypted-storage';
import {JWT_KEY, REFRESH_KEY, APP_URL, DEV_URL} from '@env';
import RouteDetails from './src/Screens/RouteDetails';
import CreateRoute from './src/Screens/CreateRoute';
import Signup from './src/Screens/Signup';
import Settings from './src/Screens/Settings';
import Ionicon from 'react-native-vector-icons/Ionicons';
import {
  CommonActions,
  StackActions,
  NavigationAction,
} from '@react-navigation/native';

//this one also needs updatting
function App() {
  const [jwt, setJwt] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navTheme = DefaultTheme;
  navTheme.colors.background = 'white';

  async function handleFetchToken(type) {
    let storedToken = '';

    if (RNSecureStorage) {
      await RNSecureStorage.get(type === 'jwt' ? JWT_KEY : REFRESH_KEY)
        .then(value => {
          if (value !== '') {
            setJwt(value);
            storedToken = value;
          } else {
            setJwt('');
          }
        })
        .catch(err => {
          console.log(err);
          setJwt('');
        });
    } else {
      try {
        const token = await EncryptedStorage.getItem(
          type === 'jwt' ? JWT_KEY : REFRESH_KEY,
        );
        if (token || token !== '') {
          setJwt(token);
          storedToken = token;
        } else {
          setJwt('');
        }
      } catch (error) {
        console.log('ERR retrieving token: ', error);
      }
    }
    return storedToken;
  }

  async function handleStoreToken(token, type) {
    if (RNSecureStorage) {
      RNSecureStorage.set(type === 'jwt' ? JWT_KEY : REFRESH_KEY, token, {
        accessible: ACCESSIBLE.WHEN_UNLOCKED,
      }).then(
        res => {
          if (type === 'jwt') {
            setJwt(token);
          }
          return token;
        },
        err => {
          console.log('ERR Storing token: ', err);
        },
      );
    } else {
      try {
        await EncryptedStorage.setItem(
          type === 'jwt' ? JWT_KEY : REFRESH_KEY,
          token,
        );
        if (type === 'jwt') {
          setJwt(token);
        }
        return token;
      } catch (error) {
        console.log('ERR Storing token: ', error);
      }
    }
  }

  useEffect(() => {
    const handleAuth = async () => {
      const storedToken = await handleFetchToken('jwt');
      console.log('verifying auth w: ', APP_URL);
      fetch(`${APP_URL}/api/v1/auth/verify`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: storedToken,
          'User-Agent': 'any-name',
        },
        mode: 'cors',
      })
        .then(res => res.json())
        .then(async data => {
          console.log('Auth res: ', data);
          if (data.status === 200) {
            setIsAuthorized(true);
          } else if (data.status === 401) {
            handleStoreToken('', 'jwt');
            await verifyRefreshToken();
          } else {
            setIsAuthorized(false);
          }
        })
        .catch(error => {
          console.log('ERROR:', error[0]);
        });
    };

    handleAuth();
  }, []);

  async function verifyRefreshToken() {
    console.log('Old token has expired, getting new token');
    const refreshToken = await handleFetchToken('refresh');
    let replacementToken = null;

    await fetch(`${APP_URL}/api/v1/auth/verify/refresh`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: refreshToken,
        'User-Agent': 'any-name',
      },
      mode: 'cors',
    })
      .then(res => res.json())
      .then(async data => {
        // console.log('Refresh res: ', data.body);
        if (data.status === 200) {
          setIsAuthorized(true);
          setJwt(data.body.jwtToken);
          await handleStoreToken(data.body.jwtToken, 'jwt');
          await handleStoreToken(data.body.refreshToken, 'refresh');
          replacementToken = data.body.jwtToken;
        } else {
          await handleStoreToken('', 'refresh');
          await handleStoreToken('', 'jwt');
          setJwt('');
          setIsAuthorized(false);
        }
      })
      .catch(error => {
        console.log('ERROR:', error[0]);
      });
    return replacementToken;
  }

  const config = {
    animation: 'spring',
    config: {
      stiffness: 1000,
      damping: 500,
      mass: 3,
      overshootClamping: true,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
    },
  };

  const RouteStack = createStackNavigator();

  const RouteStackScreens = () => {
    return (
      <RouteStack.Navigator>
        <RouteStack.Screen
          name="Routes"
          children={({navigation, route}) => (
            <Routes
              isAuthorized={isAuthorized}
              navigation={navigation}
              route={route}
            />
          )}
          options={{
            headerStyle: {
              shadowColor: 'transparent', // this covers iOS
              elevation: 0, // this covers Android
            },
            headerTitle: () => (
              <Image
                source={require('./src/Assets/ek_logo_trim.jpg')}
                style={{width: 80, height: 30}}
              />
            ),
            headerTitleAlign: 'center',
          }}
          initialParams={{createdRoute: '', updatedRoute: '', deletedRoute: ''}}
        />
        <RouteStack.Screen
          name="RouteDetails"
          component={RouteDetails}
          options={{
            headerTitle: () => (
              <Image
                source={require('./src/Assets/ek_logo_trim.jpg')}
                style={{width: 80, height: 30}}
              />
            ),
            headerBackTitle: ' ',
            headerTitleAlign: 'center',
            headerBackImage: () => (
              <Ionicon name="chevron-back-outline" size={35} color="black" />
            ),
            headerStyle: {
              shadowColor: 'transparent', // this covers iOS
              elevation: 0, // this covers Android
            },
          }}
        />
        <RouteStack.Screen
          name="CreateRoute"
          component={CreateRoute}
          options={{
            headerTitle: () => (
              <Image
                source={require('./src/Assets/ek_logo_trim.jpg')}
                style={{width: 80, height: 30}}
              />
            ),
            headerBackTitle: ' ',
            headerTitleAlign: 'center',
            headerBackImage: () => (
              <Ionicon name="chevron-back-outline" size={35} color="black" />
            ),
            headerStyle: {
              shadowColor: 'transparent', // this covers iOS
              elevation: 0, // this covers Android
              backgroundColor: 'white',
            },
          }}
        />
      </RouteStack.Navigator>
    );
  };

  const AuthStack = createStackNavigator();

  const AuthStackScreens = () => {
    return (
      <AuthStack.Navigator>
        <AuthStack.Screen
          name="Login"
          children={({navigation, route}) => (
            <Login isAuthorized={isAuthorized} navigation={navigation} />
          )}
          options={{
            headerTitle: '',
            headerStyle: {
              shadowColor: 'transparent', // this covers iOS
              elevation: 0, // this covers Android
            },
          }}
        />
        <AuthStack.Screen
          name="Signup"
          component={Signup}
          options={{
            headerTitle: () => (
              <Image
                source={require('./src/Assets/ek_logo_trim.jpg')}
                style={{width: 80, height: 30}}
              />
            ),
            headerBackTitle: ' ',
            headerTitleAlign: 'center',
            headerBackImage: () => (
              <Ionicon name="chevron-back-outline" size={35} color="black" />
            ),
            headerStyle: {
              shadowColor: 'transparent', // this covers iOS
              elevation: 0, // this covers Android
              backgroundColor: 'white',
            },
          }}
        />
      </AuthStack.Navigator>
    );
  };

  const SettingsStack = createStackNavigator();

  const SettingsStackScreens = () => {
    return (
      <SettingsStack.Navigator>
        <SettingsStack.Screen
          name="Settings"
          component={Settings}
          options={{
            headerTitle: () => (
              <Image
                source={require('./src/Assets/ek_logo_trim.jpg')}
                style={{width: 80, height: 30}}
              />
            ),
            headerTitleAlign: 'center',
            cardStyle: {backgroundColor: 'white'},
            gestureDirection: 'horizontal',
            transitionSpec: {
              open: config,
              close: config,
            },
            headerStyle: {
              shadowColor: 'transparent', // this covers iOS
              elevation: 0, // this covers Android
            },
          }}
        />
      </SettingsStack.Navigator>
    );
  };

  const Tab = createBottomTabNavigator();

  return (
    <SafeAreaProvider>
      <UserContext.Provider
        value={[
          jwt,
          setJwt,
          handleStoreToken,
          handleFetchToken,
          verifyRefreshToken,
        ]}>
        <NavigationContainer>
          <Tab.Navigator
            initialRouteName={'Login'}
            screenOptions={({route, navigation}) => ({
              tabBarIcon: ({focused, color, size}) => {
                let iconName;
                let rn = route.name;

                switch (rn) {
                  case 'Routes':
                    return (
                      <Ionicon
                        name={'earth-outline'}
                        size={size}
                        color={color}
                      />
                    );
                  case 'Settings':
                    return (
                      <Ionicon
                        name={'person-outline'}
                        size={size}
                        color={color}
                      />
                    );
                  case 'Login':
                    return (
                      <Ionicon
                        name={'log-out-outline'}
                        size={size}
                        color={color}
                      />
                    );
                }
              },
              tabBarActiveTintColor: '#DC143C',
              tabBarInactiveTintColor: 'gray',
              tabBarLabelStyle: {
                paddingBottom: 10,
                fontSize: 10,
                position: 'absolute',
              },
              tabBarStyle: {
                padding: Platform.OS === 'android' ? 0 : 10,
                height: 70,
              },
              tabBarHideOnKeyboard: true,
              headerShown: false,
              tabBarLabel:
                Platform.OS === 'ios'
                  ? ''
                  : route.name.toLowerCase() === 'login'
                  ? 'Logout'
                  : route.name,
            })}>
            <Tab.Screen
              name="Login"
              component={AuthStackScreens}
              options={{tabBarStyle: {display: 'none'}}}
              listeners={({navigation, route}) => ({
                tabPress: async e => {
                  //This is the logout logic, should really hit the
                  //logout user api url but it works
                  fetch(`${APP_URL}/api/v1/routes/deactivate/current`, {
                    method: 'POST',
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
                    .then(async data => {
                      console.log('logged out successfully');
                    })
                    .catch(error => {
                      console.log(
                        'Unable to deactivate route with ERROR:',
                        error,
                      );
                    });

                  //resetting nav state when you logout
                  const state = navigation.dangerouslyGetState();
                  if (state) {
                    const nonTargetTabs = state.routes.filter(
                      r => r.key !== e.target,
                    );

                    nonTargetTabs.forEach(tab => {
                      const tabName = tab?.name;
                      const stackKey = tab?.state?.key;

                      if (stackKey && tabName === 'Routes') {
                        navigation.dispatch({
                          ...StackActions.popToTop(),
                          target: stackKey,
                        });
                      }
                    });
                  }

                  if (RNSecureStorage) {
                    RNSecureStorage.set('creds', '', {
                      accessible: ACCESSIBLE.WHEN_UNLOCKED,
                    }).then(
                      res => {
                        console.log('Reset creds successfully');
                      },
                      err => {
                        console.log('ERR Storing token: ', err);
                      },
                    );
                  } else {
                    try {
                      await EncryptedStorage.setItem('creds', '');
                      console.log('Reset creds successfully');
                    } catch (error) {
                      console.log('ERR Storing token: ', error);
                    }
                  }

                  setIsAuthorized(false);
                  await handleStoreToken('', 'jwt');
                },
              })}
            />
            <Tab.Screen name="Routes" component={RouteStackScreens} />
            <Tab.Screen name="Settings" component={SettingsStackScreens} />
          </Tab.Navigator>
        </NavigationContainer>
      </UserContext.Provider>
    </SafeAreaProvider>
  );
}

export default App;
//prepare the build and put it on terrys phone
