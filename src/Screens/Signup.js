import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {TextInput} from 'react-native-gesture-handler';
import {STORE_KEY, APP_URL} from '@env';
import {useNavigation} from '@react-navigation/native';

const {width, height} = Dimensions.get('screen');

//mingold1@gmail.com
//Password1
const Signup = () => {
  const [error, setError] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigation();

  const handleCreateAccount = () => {
    if (
      email.trim() === '' ||
      password.trim() === '' ||
      firstName.trim() === '' ||
      lastName.trim() === ''
    ) {
      setError('Please fill out all fields');
    } else {
      setLoading(true);
      fetch(`${APP_URL}/api/v1/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({
          email: email,
          password: password,
          firstName: firstName,
          lastName: lastName,
        }),
      })
        .then(res => res.json())
        .then(async data => {
          console.log(data.body);
          if (data.status === 200) {
            nav.navigate('Login');
          } else {
            setError(data.body.message[0]);
          }
          setLoading(false);
        })
        .catch(error => {
          console.log('Unable to create account:', error);
        });
    }
  };

  return (
    <>
      {!loading ? (
        <View style={styles.containerStyle}>
          <Text style={styles.headerTextStyles}>Sign up</Text>
          <View style={styles.inputsStyles}>
            <TextInput
              style={styles.inputStyles}
              placeholder="Email"
              value={email}
              onChangeText={e => setEmail(e.valueOf())}
            />
            <TextInput
              style={styles.inputStyles}
              placeholder="Password"
              value={password}
              secureTextEntry={true}
              onChangeText={e => setPassword(e.valueOf())}
            />
            <TextInput
              style={styles.inputStyles}
              placeholder="First name"
              value={firstName}
              onChangeText={e => setFirstName(e.valueOf())}
            />
            <TextInput
              style={styles.inputStyles}
              placeholder="Last name"
              value={lastName}
              onChangeText={e => setLastName(e.valueOf())}
            />
          </View>
          <View style={{gap: 10}}>
            <TouchableOpacity
              style={styles.buttonStyles}
              onPress={handleCreateAccount}>
              <Text style={styles.buttonTextStyles}>Create Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{...styles.buttonStyles, backgroundColor: 'black'}}
              onPress={() => {
                setEmail('');
                setPassword('');
                setFirstName('');
                setLastName('');
              }}>
              <Text style={styles.buttonTextStyles}>Reset</Text>
            </TouchableOpacity>
          </View>
          {error && <Text style={styles.errorStyle}>{error}</Text>}
        </View>
      ) : (
        <View style={styles.containerStyle}>
          <ActivityIndicator size="small" color="#0000ff" />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  containerStyle: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    gap: 50,
  },
  contentStyles: {
    flex: 1,
    alignItems: 'center',
    marginTop: 100,
    gap: 50,
  },
  headerTextStyles: {
    fontSize: 30,
    fontWeight: '500',
    color: 'black',
  },
  buttonTextStyles: {
    fontSize: 20,
    fontWeight: '500',
    color: 'white',
  },
  buttonStyles: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1bab05',
    width: width - 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputsStyles: {
    backgroundColor: 'white',
    padding: 20,
    gap: 20,
  },
  inputStyles: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomColor: 'gainsboro',
    borderBottomWidth: 1,
    fontSize: 20,
    backgroundColor: 'white',
    width: width - 40,
  },
  errorStyle: {
    color: 'red',
  },
});

export default Signup;
