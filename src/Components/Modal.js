import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  Keyboard,
  FlatList,
} from 'react-native';
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import Contact from './Contact';

const {width, height} = Dimensions.get('screen');

//might not clear the keyboard on ios
const Modal = ({
  children,
  list,
  onClick,
  background,
  closeModal,
  subscribers,
  state,
}) => {
  const [allContacts, setAllContacts] = useState(list);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [customNumber, setCustomNumber] = useState('');
  const [keyboardStatus, setKeyboardStatus] = useState(false);
  const [listElements, setListElements] = useState();

  useEffect(() => {
    const keyboardShown = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardStatus(true);
    });
    const keyboardHidden = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardStatus(false);
    });

    return () => {
      keyboardShown.remove();
      keyboardHidden.remove();
    };
  }, []);

  function addToSelected(number) {
    const alreadyAdded = subscribers.filter(sub => sub.number == number);
    if (
      selectedContacts.length + subscribers.length <= 4 ||
      alreadyAdded <= 0
    ) {
      setSelectedContacts(prev => [...prev, JSON.parse(number)]);
    }
  }

  function removeFromSelected(number) {
    const res = selectedContacts.filter(item => item != number);
    setSelectedContacts(res);
  }

  function addCustomNumberToContacts() {
    //removing the repeat number and adding the new one
    const alreadyAdded = allContacts.filter(
      contact => contact?.phoneNumbers[0]?.number === customNumber,
    );

    if (
      alreadyAdded <= 0 &&
      subscribers.length + selectedContacts.length <= 4
    ) {
      setAllContacts(prev => {
        return [...prev, {phoneNumbers: [{number: customNumber}]}];
      });

      if (selectedContacts.length < 5) {
        addToSelected(customNumber);
      }
      setCustomNumber('');
    }
  }

  useEffect(() => {
    setListElements(() => {
      return allContacts
        .filter(
          contact =>
            contact.phoneNumbers.length > 0 &&
            contact.phoneNumbers[0].number.length > 6,
        )
        .map((contact, index) => {
          let temp = contact.phoneNumbers[0].number;
          temp = temp.replaceAll('(', '');
          temp = temp.replaceAll(')', '');
          temp = temp.replaceAll('-', '');
          temp = temp.replaceAll(' ', '');
          temp = temp.replaceAll('+', '');
          temp = temp.replace(/[^\d.-]+/g, '');

          if (temp.length > 10) temp = temp.substring(1);

          return (
            <Contact
              contact={contact}
              addToSelected={addToSelected}
              removeFromSelected={removeFromSelected}
              key={index}
              state={state}
            />
          );
        });
    });
  }, [subscribers, state]);

  useEffect(() => {
    setAllContacts(list);
  }, [list]);

  return (
    <View style={styles.container}>
      <View
        style={{
          ...styles.content,
          backgroundColor: background,
        }}>
        {list <= 0 && <Text>Contacts not available</Text>}
        <ScrollView>{listElements}</ScrollView>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 20,
          }}>
          <Text style={{...styles.text, color: 'black'}}>+1</Text>
          <TextInput
            style={{...styles.inputStyles, flex: 1}}
            placeholder="Enter a number"
            value={customNumber}
            onChangeText={e => setCustomNumber(e.valueOf())}
          />
          <TouchableOpacity
            style={{
              ...styles.buttonStyles,
              borderRadius: 50,
              minHeight: 50,
              minWidth: 50,
              maxHeight: 50,
              maxWidth: 50,
              borderWidth: 0,
              backgroundColor:
                customNumber.trim().length >= 10
                  ? selectedContacts.length + subscribers.length >= 5
                    ? 'gainsboro'
                    : '#1e90ff'
                  : 'gainsboro',
            }}
            disabled={
              customNumber.trim().length >= 10
                ? selectedContacts.length + subscribers.length >= 5
                  ? true
                  : false
                : true
            }
            onPress={addCustomNumberToContacts}>
            <Text style={{...styles.buttonTextStyles, color: 'white'}}>+</Text>
          </TouchableOpacity>
        </View>
        <View
          style={{
            flexDirection: 'row',
            width: width - 100,
            height: 50,
            justifyContent: 'space-between',
            marginTop: 20,
          }}>
          <TouchableOpacity
            style={styles.buttonStyles}
            onPress={() => {
              setSelectedContacts([]);
              onClick(selectedContacts);
            }}>
            <Text style={styles.buttonTextStyles}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              ...styles.buttonStyles,
              backgroundColor: 'black',
              borderColor: 'black',
            }}
            onPress={closeModal}>
            <Text style={{...styles.buttonTextStyles, color: 'white'}}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    width: width,
    height: height,
    backgroundColor: 'rgba(0,0,0, .2)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    borderRadius: 20,
    elevation: 2,
    fontSize: 20,
    color: 'white',
    margin: 20,
    padding: 20,
    maxHeight: height - 240,
  },
  header: {
    textAlign: 'center',
    color: 'black',
    fontSize: 30,
  },
  text: {
    textAlign: 'center',
    color: 'white',
    fontSize: 20,
  },
  inputsStyles: {
    backgroundColor: 'white',
  },
  inputStyles: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomColor: 'gainsboro',
    borderBottomWidth: 1,
    fontSize: 20,
    backgroundColor: 'white',
  },
  contact: {
    borderBottomColor: 'black',
    borderBottomWidth: 2,
    marginBottom: 10,
    fontSize: 20,
  },
  buttonTextStyles: {
    fontSize: 20,
    fontWeight: '500',
    color: '#de3623',
    textAlign: 'center',
  },
  buttonStyles: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'pink',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#de3623',
    borderWidth: 1,
    width: width - 240,
  },
});

export default Modal;
