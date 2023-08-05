import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const {width, height} = Dimensions.get('screen');

//contacts update properly now but its so slow, maybe fix it later
const Contact = ({contact, removeFromSelected, addToSelected, state}) => {
  const [number, setNumber] = useState('');
  const [selected, setSelected] = useState();

  useEffect(() => {
    let temp = contact.phoneNumbers[0].number;
    temp = temp.replaceAll('(', '');
    temp = temp.replaceAll(')', '');
    temp = temp.replaceAll('-', '');
    temp = temp.replaceAll(' ', '');
    setNumber(temp);
  }, []);

  useEffect(() => {
    setSelected(prev => !state);
  }, [state]);

  return (
    <TouchableOpacity
      onPress={e => {
        e.preventDefault();
        if (selected) {
          removeFromSelected(number);
        } else {
          addToSelected(number);
        }
        setSelected(prev => !prev);
      }}
      style={styles.contact}>
      <Text
        style={{
          ...styles.text,
        }}>
        {contact.givenName
          ? `${contact.givenName} ${contact.familyName}`
          : number}
      </Text>
      {selected && (
        <Icon name="checkmark-circle-outline" size={25} color="#1bab05" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, .2)',
    width: width,
    height: height,
    overflow: 'visible',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    width: width - 40,
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    fontSize: 20,
    color: 'white',
    gap: 20,
  },
  header: {
    textAlign: 'center',
    color: 'black',
    fontSize: 30,
  },
  text: {
    color: 'black',
    fontSize: 22,
  },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 5,
    paddingBottom: 5,
    borderBottomColor: 'gainsboro',
    borderBottomWidth: 1,
    width: width - 100,
  },
  buttonTextStyles: {
    fontSize: 20,
    fontWeight: '500',
    color: 'white',
    width: 100,
    textAlign: 'center',
  },
  buttonStyles: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1bab05',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Contact;
