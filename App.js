import {SafeAreaProvider} from 'react-native-safe-area-context';
import 'react-native-gesture-handler';
import React, {useState, useEffect} from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  useNavigation,
} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Home from './src/Screens/Home';
import Login from './src/Screens/Login';
import Routes from './src/Screens/Routes';
import {UserContext} from './UserContext';
import RNSecureStorage, {ACCESSIBLE} from 'rn-secure-storage';
import EncryptedStorage from 'react-native-encrypted-storage';
import {STORE_KEY, APP_URL, DEV_URL} from '@env';
import RouteDetails from './src/Screens/RouteDetails';
import CreateRoute from './src/Screens/CreateRoute';
import Signup from './src/Screens/Signup';
import Settings from './src/Screens/Settings';
import Ionicon from 'react-native-vector-icons/Ionicons';

//use popups to tell users they arent logged in or whatever
function App() {
  const [jwt, setJwt] = useState();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const navTheme = DefaultTheme;
  navTheme.colors.background = 'white';

  async function handleFetchToken() {
    if (RNSecureStorage) {
      RNSecureStorage.get(STORE_KEY)
        .then(value => {
          if (value !== '') {
            setJwt(value);
          } else {
            setJwt(null);
          }
        })
        .catch(err => {
          console.log(err);
          setJwt(null);
        });
    } else {
      try {
        const token = await EncryptedStorage.getItem(STORE_KEY);
        console.log('STORED VAL: ', token);
        if (token || token !== '') {
          setJwt(token);
        } else {
          setJwt(null);
        }
      } catch (error) {
        console.log('ERR retrieving token: ', error);
      }
    }
  }

  async function handleStoreToken(token) {
    if (RNSecureStorage) {
      RNSecureStorage.set(STORE_KEY, token, {
        accessible: ACCESSIBLE.WHEN_UNLOCKED,
      }).then(
        res => {
          setJwt(token);
        },
        err => {
          console.log(err);
        },
      );
    } else {
      try {
        console.log('STORING: ', token);
        await EncryptedStorage.setItem(STORE_KEY, token);
        setJwt(token);
      } catch (error) {
        console.log('ERR Storing token: ', error);
      }
    }
  }

  const handleLogout = async () => {
    try {
      await EncryptedStorage.removeItem(STORE_KEY);
    } catch (error) {
      console.log('User not logged in');
    }
  };

  useEffect(() => {
    const handleAuth = async () => {
      await handleFetchToken();
      fetch(`${DEV_URL}/api/v1/auth/verify`, {
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
          console.log('IS AUTH: ', data);
          if (data.status === 200) {
            setIsAuthorized(true);
          } else {
            handleStoreToken('');
          }
        })
        .catch(error => {
          console.log('ERROR:', error[0]);
        });
    };

    handleAuth();
  }, []);

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
          component={Routes}
          options={{
            headerStyle: {
              shadowColor: 'transparent', // this covers iOS
              elevation: 0, // this covers Android
            },
          }}
        />
        <RouteStack.Screen
          name="RouteDetails"
          component={RouteDetails}
          options={{
            headerTitle: '',
            headerBackTitle: ' ',
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
            headerTitle: '',
            headerBackTitle: ' ',
            headerBackImage: () => (
              <Ionicon name="chevron-back-outline" size={35} color="black" />
            ),
            headerStyle: {
              shadowColor: 'transparent', // this covers iOS
              elevation: 0, // this covers Android
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
          component={Login}
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
            headerBackTitle: 'back',
            headerTitle: '',
            headerStyle: {
              shadowColor: 'transparent', // this covers iOS
              elevation: 0, // this covers Android
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
            headerTitle: 'Settings',
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
        value={[jwt, setJwt, handleStoreToken, handleFetchToken]}>
        <NavigationContainer>
          <Tab.Navigator
            initialRouteName={'Routes'}
            screenOptions={({route}) => ({
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
                  case 'Logout':
                    return (
                      <Ionicon
                        name={'log-out-outline'}
                        size={size}
                        color={color}
                      />
                    );
                }
              },
              tabBarActiveTintColor: '#90EE90',
              tabBarInactiveTintColor: 'gray',
              tabBarLabelStyle: {
                paddingBottom: 10,
                fontSize: 10,
                position: 'absolute',
              },
              tabBarStyle: {padding: 10, height: 70},
              tabBarHideOnKeyboard: true,
              headerShown: false,
              tabBarLabel: '',
            })}>
            <Tab.Screen
              name="Logout"
              component={AuthStackScreens}
              options={{tabBarStyle: {display: 'none'}}}
            />
            <Tab.Screen name="Routes" component={RouteStackScreens} />
            <Tab.Screen name="Settings" component={SettingsStackScreens} />
          </Tab.Navigator>
          {/* <Stack.Navigator screenOptions={{gestureDirection: 'horizontal'}}>
          {!isAuthorized && (
            <Stack.Screen
              name="Login"
              component={Login}
              options={{
                headerTitle: '',
                cardStyle: {
                  backgroundColor: 'white',
                  gestureDirection: 'horizontal',
                  transitionSpec: {
                    open: config,
                    close: config,
                  },
                },
              }}
            />
          )}
          <Stack.Screen
            name="Home"
            component={Home}
            options={{headerTitle: ''}}
          />
          <Stack.Screen
            name="Routes"
            component={Routes}
            options={{
              headerTitle: 'Your routes',
              headerLeft: '',
              headerTitleAlign: 'center',
              cardStyle: {backgroundColor: 'white'},
              gestureDirection: 'horizontal',
              transitionSpec: {
                open: config,
                close: config,
              },
            }}
          />
          <Stack.Screen
            name="RouteDetails"
            component={RouteDetails}
            options={{
              headerTitle: 'Route details',
              headerTitleAlign: 'center',
              cardStyle: {backgroundColor: 'white'},
              gestureDirection: 'horizontal',
              transitionSpec: {
                open: config,
                close: config,
              },
            }}
          />
          <Stack.Screen
            name="CreateRoute"
            component={CreateRoute}
            options={{
              headerTitle: 'Create a route',
              headerTitleAlign: 'center',
              cardStyle: {backgroundColor: 'white'},
              gestureDirection: 'horizontal',
              transitionSpec: {
                open: config,
                close: config,
              },
            }}
          />
          <Stack.Screen
            name="Signup"
            component={Signup}
            options={{
              headerTitle: '',
              cardStyle: {
                backgroundColor: 'white',
                gestureDirection: 'horizontal',
                transitionSpec: {
                  open: config,
                  close: config,
                },
              },
            }}
          />
          <Stack.Screen
            name="Settings"
            component={Settings}
            options={{
              headerTitle: 'Settings',
              headerTitleAlign: 'center',
              cardStyle: {backgroundColor: 'white'},
              gestureDirection: 'horizontal',
              transitionSpec: {
                open: config,
                close: config,
              },
            }}
          />
        </Stack.Navigator> */}
        </NavigationContainer>
      </UserContext.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  textStyles: {
    fontSize: 20,
    fontWeight: '500',
  },
});

export default App;
