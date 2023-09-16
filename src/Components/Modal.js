import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Dimensions, FlatList} from 'react-native';
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import Contact from './Contact';

const {width, height} = Dimensions.get('screen');

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
  const [formattedContacts, setFormattedContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState(list);

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
    const alreadyAdded = allContacts.filter(
      contact => contact?.phoneNumbers[0]?.number === customNumber,
    );

    const notAlreadyAdded = allContacts.filter(
      contact => contact?.phoneNumbers[0]?.number !== customNumber,
    );

    if (subscribers.length + selectedContacts.length <= 4) {
      setAllContacts(prev => {
        return [
          ...notAlreadyAdded,
          {...alreadyAdded[0], phoneNumbers: [{number: customNumber}]},
        ];
      });

      if (selectedContacts.length < 5) {
        addToSelected(customNumber);
      }
    }
  }

  console.log('filtered: ', allContacts.length);

  useEffect(() => {
    sortContacts();
    setFormattedContacts(() => {
      return filteredContacts.reduce((total, contact) => {
        if (
          contact.phoneNumbers.length > 0 &&
          contact.phoneNumbers[0].number.length > 6
        ) {
          let temp = contact.phoneNumbers[0].number;
          temp = temp.replaceAll('(', '');
          temp = temp.replaceAll(')', '');
          temp = temp.replaceAll('-', '');
          temp = temp.replaceAll(' ', '');
          temp = temp.replaceAll('+', '');
          temp = temp.replace(/[^\d.-]+/g, '');

          if (temp.length > 10) temp = temp.substring(1);
          contact.phoneNumbers[0].number = temp;

          return [
            ...total,
            {
              contact: contact,
              addToSelected: addToSelected,
              removeFromSelected: removeFromSelected,
              key: JSON.stringify(contact),
              state: state,
              selected: customNumber === temp,
            },
          ];
        } else {
          return total;
        }
      }, []);
    });
    setCustomNumber('');
  }, [subscribers, allContacts, state, selectedContacts, filteredContacts]);

  function sortContacts() {
    filteredContacts.sort(function (a, b) {
      const textA = a.givenName?.toUpperCase();
      const textB = b.givenName?.toUpperCase();
      return textA < textB ? -1 : textA > textB ? 1 : 0;
    });
  }

  useEffect(() => {
    setAllContacts(list);
  }, [list]);

  useEffect(() => {
    setFilteredContacts(allContacts);
  }, [allContacts]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchQuery.trim() != '') {
        const results = allContacts.filter(contact => {
          return (
            contact?.givenName
              ?.toLowerCase()
              .indexOf(searchQuery.toLowerCase()) !== -1 ||
            contact?.familyName
              ?.toLowerCase()
              .indexOf(searchQuery.toLowerCase()) !== -1
          );
        });
        setFilteredContacts(results);
      } else if (allContacts.length > 0) {
        setFilteredContacts(allContacts);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  return (
    <ScrollView
      style={{
        ...styles.container,
      }}>
      <View
        style={{
          ...styles.content,
          backgroundColor: background,
        }}>
        {list <= 0 && <Text>Contacts not available</Text>}
        <ScrollView>
          <TextInput
            style={{...styles.inputStyles, flex: 1, textAlign: 'center'}}
            placeholder="Search contacts"
            value={searchQuery}
            onChangeText={e => {
              setSearchQuery(e.valueOf());
            }}
          />
          <FlatList
            scrollEnabled={false}
            data={formattedContacts}
            renderItem={({item}) => (
              <Contact
                contact={item.contact}
                addToSelected={addToSelected}
                removeFromSelected={removeFromSelected}
                key={JSON.stringify(item.contact)}
                state={state}
                init={item.init}
              />
            )}
            keyExtractor={item => item.key}
            ListFooterComponent={() => (
              <Text style={{flex: 1, textAlign: 'center', marginVertical: 10}}>
                Results: {JSON.stringify(formattedContacts.length)}
              </Text>
            )}
          />
        </ScrollView>
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
                    : 'black'
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
            gap: 10,
            marginTop: 20,
            width: width - 100,
            justifyContent: 'space-evenly',
          }}>
          <TouchableOpacity
            style={{...styles.buttonStyles, backgroundColor: '#AFE1AF'}}
            onPress={() => {
              onClick(selectedContacts);
              setSelectedContacts([]);
              closeModal();
            }}>
            <Text style={{...styles.buttonTextStyles, color: '#03c04a'}}>
              Add
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              ...styles.buttonStyles,
            }}
            onPress={() => {
              setSelectedContacts([]);
              closeModal();
            }}>
            <Text style={{...styles.buttonTextStyles}}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    width: width,
    height: height,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    borderRadius: 20,
    fontSize: 20,
    color: 'white',
    margin: 20,
    padding: 20,
    maxHeight: height - 240,
    backgroundColor: 'none',
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
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'pink',
    height: 50,
    width: 100,
  },
});

export default Modal;
