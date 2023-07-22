import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Pressable,
  TouchableOpacity,
  PermissionsAndroid,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import {useState, useEffect, useContext} from 'react';
import {STORE_KEY, APP_URL, DEV_URL} from '@env';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Geolocation from 'react-native-geolocation-service';
import uuid from 'react-uuid';

const {width, height} = Dimensions.get('screen');

const RouteCard = props => {
  const [active, setActive] = useState(props.active);
  const [error, setError] = useState('');
  const nav = useNavigation();

  const rightSwipe = (progress, dragX) => {
    return (
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteRoute}>
          <Icon name="trash" size={25} color={'#de3623'} />
        </TouchableOpacity>
      </View>
    );
  };

  const handleActivation = async e => {
    e.stopPropagation();
    setActive(true);

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
          message: 'Can we access your location in the background?',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (backPerm === 'granted' && frontPerm == 'granted') {
        Geolocation.getCurrentPosition(
          position => {
            fetch(`${DEV_URL}/api/v1/routes/activate`, {
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
                  props.openPopup('Route not activated', 'red');
                  setTimeout(() => {
                    props.closePopup();
                  }, 3000);
                }
              })
              .catch(error => {
                console.log('ERROR:', error);
                setActive(false);
                props.openPopup('Route not activated', 'red');
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
      } else {
        console.log('You cannot use Geolocation');
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeactivation = async e => {
    e.stopPropagation();
    setActive(false);

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
          message: 'Can we access your location in the background?',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (backPerm === 'granted' && frontPerm == 'granted') {
        console.log('Sending current location to server');

        Geolocation.getCurrentPosition(
          position => {
            fetch(`${DEV_URL}/api/v1/routes/deactivate`, {
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
              }),
            })
              .then(res => res.json())
              .then(data => {
                if (data.status !== 200) {
                  setActive(true);
                  props.openPopup('Unable to deactive route', 'red');
                  setTimeout(() => {
                    props.closePopup();
                  }, 3000);
                } else {
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
      } else {
        console.log('You cannot use Geolocation');
      }
    } catch (err) {
      console.log(err);
    }
  };

  function handleDeleteRoute() {
    console.log('Deleting route...');
    fetch(`${DEV_URL}/api/v1/routes/delete`, {
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
        console.log('Route deleted: ', data);
        if (data.status === 204) {
          props.toggleUpdate(uuid());
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
      renderRightActions={rightSwipe}
      containerStyle={{
        overflow: 'visible',
      }}>
      <TouchableOpacity
        style={styles.container}
        onPress={() => nav.navigate('RouteDetails', {routeId: props.id})}>
        <View>
          <Text style={{fontWeight: '400', fontSize: 20, color: 'black'}}>
            {props.routeName}
          </Text>
        </View>
        <View>
          <TouchableOpacity
            style={{
              borderColor: active ? '#1bab05' : 'gainsboro',
              borderRadius: 30,
              padding: 3,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={active ? handleDeactivation : handleActivation}>
            <Icon
              name="power"
              size={30}
              color={active ? '#03c04a' : 'gainsboro'}
            />
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
    padding: 20,
    backgroundColor: 'white',
    height: 75,
    width: width - 40,
    overflow: 'visible',
    borderBottomWidth: 1,
    borderBottomColor: 'gainsboro',
  },
  content: {},
  controls: {},
  deleteButton: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 75,
    height: 60,
    width: 60,
    marginHorizontal: 10,
  },
});

export default RouteCard;
