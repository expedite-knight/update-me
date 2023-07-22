import 'react-native-gesture-handler';
import React, {useState, useEffect} from 'react';
import {StatusBar, StyleSheet} from 'react-native';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Home from './src/Screens/Home';
import Login from './src/Screens/Login';
import Routes from './src/Screens/Routes';
import {UserContext} from './UserContext';
import RNSecureStorage, {ACCESSIBLE} from 'rn-secure-storage';
import {STORE_KEY, APP_URL, DEV_URL} from '@env';
import RouteDetails from './src/Screens/RouteDetails';
import CreateRoute from './src/Screens/CreateRoute';
import Signup from './src/Screens/Signup';
import Settings from './src/Screens/Settings';
import Ionicon from 'react-native-vector-icons/Ionicons';

// const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

//use popups to tell users they arent logged in or whatever
function App() {
  const [jwt, setJwt] = useState();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const navTheme = DefaultTheme;
  navTheme.colors.background = 'white';

  function handleFetchToken() {
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
  }

  function handleStoreToken(token) {
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
  }

  useEffect(() => {
    handleFetchToken();
    //this req is making sure the token is still valid
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
        console.log(data);
        if (data.status === 200) {
          setIsAuthorized(true);
        } else {
          handleStoreToken('');
        }
      })
      .catch(error => {
        console.log('ERROR:', error);
      });
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

  //figure out why you cant login and when you do that, download all the code
  //onto the macbook so you can use your iphone as a tester and go to starbucks
  //and write the code and push it
  return (
    <UserContext.Provider
      value={[jwt, setJwt, handleStoreToken, handleFetchToken]}>
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName={isAuthorized ? 'Routes' : 'Login'}
          screenOptions={({route}) => ({
            tabBarIcon: ({focused, color, size}) => {
              let iconName;
              let rn = route.name;

              switch (rn) {
                case 'Routes':
                  return (
                    <Ionicon name={'earth-outline'} size={size} color={color} />
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
            tabBarLabelStyle: {paddingBottom: 10, fontSize: 10},
            tabBarStyle: {padding: 10, height: 70},
            tabBarHideOnKeyboard: true,
          })}>
          <Tab.Screen
            name="Logout"
            component={Login}
            options={{tabBarStyle: {display: 'none'}, headerTitle: ''}}
          />
          <Tab.Screen name="Routes" component={Routes} />
          <Tab.Screen name="Settings" component={Settings} />
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
  );
}

const styles = StyleSheet.create({
  textStyles: {
    fontSize: 20,
    fontWeight: '500',
  },
});

export default App;
