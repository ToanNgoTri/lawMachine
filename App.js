/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
// import {NavigationContainer} from '@react-navigation/native';
import StackNavigator from './navigators/AppNavigators';
import {createContext, useState} from 'react';
import {Provider} from 'react-redux';
import {store} from './redux/store';
import {View, Text} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
// import * as Sentry from "@sentry/react-native";

const BoxInHomeScreen = createContext(); 
// const InfoDownloaded = createContext(); //
const RefOfHome = createContext(); //
// const RefOfSearchLaw = createContext(); //
// const RefOfSearchContent = createContext(); //

import Toast, { BaseToast } from 'react-native-toast-message';

const toastConfig = {
  success: (props) => (
    <BaseToast
    text1={props.text1}   // 👈 Quan trọng
      text2={props.text2}   // 👈 Quan trọng
      style={{
        borderLeftColor: '#4CAF50',
        backgroundColor: '#000000ff',
        borderRadius: 12,
        padding:0,
        height:40,
        // paddingVertical: 5,
        width: '70%',
        opacity: 0.7,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center'
      }}
      // text2Style={{
      //   color: 'white',
      //   fontSize: 14,
      //   marginTop: 2
      // }}
    />
  ),
  copyToast: (props) => <ToastCustom {...props} />
}


import Ionicons from 'react-native-vector-icons/Ionicons';

const ToastCustom = ({ text1, text2 }) => {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      padding: 5,
      paddingLeft:10,
      paddingRight:10,
      backgroundColor: 'rgba(0,0,0,0.85)',
      // opacity: 0.9,
       borderRadius: 14,

    }}>
      <Ionicons name="copy-outline" size={22} color="#fff" style={{ marginRight: 10 }} />
      <View>
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{text1}</Text>
        {text2 ? (
          <Text style={{ color: '#fff' }}>{text2}</Text>
        ) : null}
      </View>
    </View>
  );
};

function App() {
  
  const [showBoxInHomeScreen, setShowBoxInHomeScreen] = useState(false);
  const updateShowBoxInHomeScreen = data => {
    setShowBoxInHomeScreen(data);
  };
  
  // const [info, setInfo] = useState({});
  // const updateInfo = data => {
  //   setInfo(data);
  // };

  const [homeRef, setHomeRef] = useState('');
  const updateHomeRef = data => {
    setHomeRef(data);
  };


  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
    <Provider store={store}>
      <BoxInHomeScreen.Provider value={{showBoxInHomeScreen, updateShowBoxInHomeScreen}}>
        <RefOfHome.Provider value={{homeRef, updateHomeRef}}>
      {/* <RefOfSearchLaw.Provider value={{searchLawRef, updatesearchLawRef}}>
      <RefOfSearchContent.Provider value={{searchContentRef, updateSearchContentRef}}> */}
            {/* <InfoDownloaded.Provider value={{info,updateInfo}}> */}
      {/* <SafeAreaProvider> */}
      {/* <SafeAreaView> */}
            <StackNavigator />
    {/* </SafeAreaView> */}
    {/* </SafeAreaProvider> */}
            {/* </InfoDownloaded.Provider> */}
{/* </RefOfSearchContent.Provider>
            </RefOfSearchLaw.Provider> */}
            </RefOfHome.Provider>
      </BoxInHomeScreen.Provider>
    </Provider>
    <Toast config={toastConfig} />
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default (App);
export { BoxInHomeScreen,RefOfHome};
