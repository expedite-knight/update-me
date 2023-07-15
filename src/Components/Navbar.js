import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import {UserContext} from '../../UserContext';
import {useNavigation} from '@react-navigation/native';

const {width, height} = Dimensions.get('screen');

const Navbar = ({handleLogout}) => {
  const nav = useNavigation();
  const [jwt, setJwt, handleStoreToken, handleFetchToken] =
    useContext(UserContext);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.icon}
        onPress={() => nav.navigate('Settings')}>
        <Icon name="settings-outline" size={30} color={'gainsboro'} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.icon} onPress={handleLogout}>
        <Icon name="log-out-outline" size={30} color={'gainsboro'} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    height: 100,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: width,
    flexDirection: 'row',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    fontSize: 50,
    padding: 15,
    borderRadius: 50,
  },
});

export default Navbar;
