import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Dimensions, Animated} from 'react-native';
import {
  GestureHandlerRootView,
  TouchableOpacity,
  PanGestureHandler,
} from 'react-native-gesture-handler';
import Ionicon from 'react-native-vector-icons/Ionicons';
import Swipeable from 'react-native-gesture-handler/Swipeable';

const {width, height} = Dimensions.get('screen');

const Popup = ({
  children,
  background,
  prompt,
  handleRouteOverride,
  closePopup,
  subtext,
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
            <View style={{gap: 10, flexDirection: 'row'}}>
              <TouchableOpacity
                style={{...styles.buttonStyles, backgroundColor: '#AFE1AF'}}
                onPress={handleRouteOverride}>
                <Text style={{...styles.buttonTextStyles, color: '#03c04a'}}>
                  Override
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  ...styles.buttonStyles,
                  backgroundColor: 'pink',
                }}
                onPress={closePopup}>
                <Text style={{...styles.buttonTextStyles, color: '#de3623'}}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  else
    return (
      <GestureHandlerRootView>
        <PanGestureHandler
          onGestureEvent={e => {
            if (e.nativeEvent.velocityY < -50) {
              closePopup();
            }
          }}>
          <View
            style={{
              ...styles.content,
              backgroundColor: background,
              position: 'absolute',
              top: 10,
              left: 20,
            }}>
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 10,
              }}>
              <Text style={{...styles.text, color: prompt ? 'black' : 'white'}}>
                {children}
              </Text>
              <Ionicon
                name={
                  background === '#1e90ff'
                    ? 'checkmark-circle-outline'
                    : 'alert-circle-outline'
                }
                size={30}
                color={'white'}
              />
            </View>
            {subtext && (
              <Text
                style={{
                  ...styles.text,
                  fontSize: 16,
                  color: prompt ? 'black' : 'white',
                }}>
                {subtext}
              </Text>
            )}
          </View>
        </PanGestureHandler>
      </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, .1)',
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
    paddingHorizontal: 30,
    paddingVertical: 20,
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
    color: '#de3623',
  },
  buttonStyles: {
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'pink',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
  },
});

export default Popup;
