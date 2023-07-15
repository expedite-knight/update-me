import React from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import {TextInput} from 'react-native-gesture-handler';

const {width, height} = Dimensions.get('screen');

const CreateRouteModal = () => {
  return (
    <View style={styles.containerStyle}>
      <View style={styles.modalStyles}>
        <Text style={styles.headerTextStyles}>Create a new route</Text>
        <View style={styles.inputsStyles}>
          <TextInput style={styles.inputStyles} placeholder="Name" />
          <TextInput style={styles.inputStyles} placeholder="Destination" />
          <TextInput style={styles.inputStyles} placeholder="Destination" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerStyle: {
    position: 'absolute',
    alignItems: 'center',
    backgroundColor: 'rgba(20,20,20,.2)',
    zIndex: 2,
    width: width,
    height: height,
    padding: 50,
  },
  modalStyles: {
    width: width - 100,
    alignItems: 'center',
    gap: 50,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    elevation: 5,
  },
  headerTextStyles: {
    fontSize: 25,
    fontWeight: '500',
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
    width: width - 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputsStyles: {
    backgroundColor: 'white',
    padding: 20,
    gap: 20,
    width: width - 100,
  },
  inputStyles: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomColor: 'gray',
    borderBottomWidth: 2,
    fontSize: 20,
    backgroundColor: 'white',
  },
  errorStyle: {
    color: 'red',
  },
});

export default CreateRouteModal;
