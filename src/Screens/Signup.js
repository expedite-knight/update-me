import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import {TextInput} from 'react-native-gesture-handler';
import {STORE_KEY, APP_URL, DEV_URL} from '@env';
import {SafeAreaView} from 'react-native-safe-area-context';

const {width, height} = Dimensions.get('screen');

const Signup = ({navigation}) => {
  const [error, setError] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

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
            navigation.navigate('Login');
          } else {
            setError(data.body.message);
          }
          setLoading(false);
        })
        .catch(error => {
          console.log('Unable to create account:', error);
        });
    }
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      {!loading ? (
        <ScrollView automaticallyAdjustKeyboardInsets={true}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <>
              <View style={styles.containerStyle}>
                <View style={{alignItems: 'center'}}>
                  <Image
                    source={require('../Assets/EK_logo.png')}
                    style={{width: 300, height: 150}}
                  />
                </View>
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
                <View style={{padding: 20, gap: 10}}>
                  <TouchableOpacity
                    style={styles.buttonStyles}
                    onPress={handleCreateAccount}>
                    <Text style={styles.buttonTextStyles}>Create Account</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      ...styles.buttonStyles,
                      backgroundColor: 'black',
                      borderColor: 'black',
                    }}
                    onPress={() => {
                      setEmail('');
                      setPassword('');
                      setFirstName('');
                      setLastName('');
                    }}>
                    <Text style={{...styles.buttonTextStyles, color: 'white'}}>
                      Reset
                    </Text>
                  </TouchableOpacity>
                </View>
                {error && <Text style={styles.errorStyle}>{error}</Text>}
              </View>
            </>
          </TouchableWithoutFeedback>
        </ScrollView>
      ) : (
        <View style={styles.containerStyle}>
          <ActivityIndicator size="small" color="black" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  containerStyle: {
    flex: 1,
    backgroundColor: 'white',
  },
  headerTextStyles: {
    fontSize: 30,
    fontWeight: '500',
    color: 'black',
  },
  buttonTextStyles: {
    fontSize: 20,
    fontWeight: '500',
    color: '#de3623',
  },
  buttonStyles: {
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'pink',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#de3623',
    borderWidth: 1,
  },
  inputsStyles: {
    backgroundColor: 'white',
    padding: 20,
  },
  inputStyles: {
    paddingVertical: 10,
    borderBottomColor: 'gainsboro',
    borderBottomWidth: 1,
    fontSize: 15,
    backgroundColor: 'white',
  },
  errorStyle: {
    textAlign: 'center',
    color: 'red',
  },
});

export default Signup;
