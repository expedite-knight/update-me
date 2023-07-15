import 'react-native-gesture-handler';
import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import Home from './src/Screens/Home';
import Login from './src/Screens/Login';
import Routes from './src/Screens/Routes';
import {UserContext} from './UserContext';
import RNSecureStorage, {ACCESSIBLE} from 'rn-secure-storage';
import {STORE_KEY, APP_URL} from '@env';
import RouteDetails from './src/Screens/RouteDetails';
import CreateRoute from './src/Screens/CreateRoute';
import Signup from './src/Screens/Signup';
import Navbar from './src/Components/Navbar';
import Icon from 'react-native-vector-icons/Ionicons';
import Settings from './src/Screens/Settings';

const Stack = createStackNavigator();

//use popups to tell users they arent logged in or whatever
function App() {
  const [jwt, setJwt] = useState();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

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
    fetch(`${APP_URL}/api/v1/auth/verify`, {
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

  //use a different way to keep track if the user is logged in or not, current
  //method doesnt work well
  return (
    <UserContext.Provider
      value={[jwt, setJwt, handleStoreToken, handleFetchToken]}>
      <NavigationContainer>
        <StatusBar backgroundColor="white" />
        <Stack.Navigator>
          {!isAuthorized && (
            <Stack.Screen
              name="Login"
              component={Login}
              options={{headerTitle: ''}}
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
            options={{headerTitle: '', headerLeft: ""}}
          />
          <Stack.Screen
            name="RouteDetails"
            component={RouteDetails}
            options={{headerTitle: ''}}
          />
          <Stack.Screen
            name="CreateRoute"
            component={CreateRoute}
            options={{headerTitle: ''}}
          />
          <Stack.Screen
            name="Signup"
            component={Signup}
            options={{headerTitle: ''}}
          />
          <Stack.Screen
            name="Settings"
            component={Settings}
            options={{headerTitle: ''}}
          />
        </Stack.Navigator>
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
