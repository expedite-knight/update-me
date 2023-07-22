import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Dimensions, Animated} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';

const {width, height} = Dimensions.get('screen');

const Popup = ({
  children,
  background,
  prompt,
  handleRouteOverride,
  closePopup,
}) => {
  if (prompt)
    return (
      <View
        style={{
          ...styles.container,
          paddingTop: 200,
        }}>
        <View style={{...styles.content, backgroundColor: background}}>
          <Text style={{...styles.text, color: prompt ? 'black' : 'white'}}>
            {children}
          </Text>
          {prompt && (
            <View style={{gap: 10}}>
              <TouchableOpacity
                style={{...styles.buttonStyles}}
                onPress={handleRouteOverride}>
                <Text style={styles.buttonTextStyles}>Override</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{...styles.buttonStyles, backgroundColor: 'black'}}
                onPress={closePopup}>
                <Text style={styles.buttonTextStyles}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  else
    return (
      <View
        style={{
          ...styles.content,
          backgroundColor: background,
          position: 'absolute',
          top: 10,
          left: 50,
        }}>
        <Text style={{...styles.text, color: prompt ? 'black' : 'white'}}>
          {children}
        </Text>
        {prompt && (
          <View style={{gap: 10}}>
            <TouchableOpacity
              style={{...styles.buttonStyles}}
              onPress={handleRouteOverride}>
              <Text style={styles.buttonTextStyles}>Override</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{...styles.buttonStyles, backgroundColor: 'black'}}
              onPress={closePopup}>
              <Text style={styles.buttonTextStyles}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    textAlign: 'center',
    textAlignVertical: 'center',
    width: width - 100,
    borderRadius: 20,
    borderColor: 'gainsboro',
    borderWidth: 2,
    padding: 20,
    elevation: 5,
    fontSize: 20,
    color: 'white',
    gap: 20,
  },
  text: {
    textAlign: 'center',
    color: 'white',
    fontSize: 20,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Popup;
