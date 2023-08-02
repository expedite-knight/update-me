import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  Keyboard,
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
}) => {
  const [allContacts, setAllContacts] = useState(list);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [customNumber, setCustomNumber] = useState('');
  const [keyboardStatus, setKeyboardStatus] = useState(false);

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
    const index = selectedContacts.indexOf(JSON.parse(number));
    const res = selectedContacts.filter(item => item != number);
    setSelectedContacts(res);
  }

  function addCustomNumberToContacts() {
    //removing the repeat number and adding the new one
    const alreadyAdded = allContacts.filter(
      contact => contact.phoneNumbers[0].number === customNumber,
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

  const listElements = allContacts.map((contact, index) => {
    let isSelected = false;
    let temp = contact.phoneNumbers[0].number;
    temp = temp.replaceAll('(', '');
    temp = temp.replaceAll(')', '');
    temp = temp.replaceAll('-', '');
    temp = temp.replaceAll(' ', '');
    temp = temp.replaceAll('+', '');

    const alreadyAdded = subscribers.filter(
      sub => sub.number == '+1'.concat(temp),
    );

    if (
      selectedContacts.indexOf(JSON.parse(temp)) != -1 ||
      alreadyAdded.length > 0
    ) {
      isSelected = true;
    } else {
      isSelected = false;
    }
    return (
      <Contact
        contact={contact}
        addToSelected={addToSelected}
        removeFromSelected={removeFromSelected}
        isSelected={isSelected}
        key={index}
      />
    );
  });

  useEffect(() => {
    setAllContacts(list);
  }, [list]);

  return (
    <View
      style={{
        ...styles.container,
      }}>
      <View
        style={{
          ...styles.content,
          backgroundColor: background,
          height: keyboardStatus ? 420 : height - 230,
        }}>
        {list <= 0 && <Text>Contacts not available</Text>}
        <ScrollView>{listElements}</ScrollView>
        <View
          style={{
            width: width - 100,
            gap: 10,
            flexDirection: 'row',
            alignItems: 'center',
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
          }}>
          <TouchableOpacity
            style={{...styles.buttonStyles}}
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

{
  /* <View
                style={{
                  flexDirection: 'row',
                  width: width - 40,
                  gap: 10,
                }}>
                <TextInput
                  style={{...styles.inputStyles, flex: 1}}
                  placeholder="Subscriber"
                  value={subscriber}
                  onChangeText={e => setSubscriber(e.valueOf())}
                />
                <TouchableOpacity
                  style={{
                    ...styles.buttonStyles,
                    backgroundColor:
                      subscriber.length >= 10
                        ? subscribers.length >= 5
                          ? 'rgba(0, 0, 0, .2)'
                          : 'black'
                        : 'rgba(0, 0, 0, .2)',
                  }}
                  onPress={handleAddSubscriber}
                  disabled={
                    subscriber.length >= 10
                      ? subscribers.length >= 5
                        ? true
                        : false
                      : true
                  }>
                  <Text style={{...styles.buttonTextStyles}}>
                    Add subscribers
                  </Text>
                </TouchableOpacity>
              </View> */
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    alignItems: 'center',
    paddingVertical: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, .2)',
    width: width,
    height: Platform === 'ios' ? height - 160 : height - 190,
    overflow: 'visible',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'column',
    width: width - 40,
    borderRadius: 20,
    padding: 20,
    elevation: 2,
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
    textAlign: 'center',
    color: 'white',
    fontSize: 20,
  },
  inputsStyles: {
    backgroundColor: 'white',
    gap: 20,
    width: width - 40,
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
    width: width - 100,
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
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'pink',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#de3623',
    borderWidth: 1,
    width: width - 260,
  },
});

export default Modal;
