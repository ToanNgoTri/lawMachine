/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
// import {NavigationContainer} from '@react-navigation/native';
import StackNavigator from './navigators/AppNavigators';
import { createContext, useEffect, useState, useRef } from 'react';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ScrollView,
  Linking,
  Platform
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Dirs, FileSystem } from 'react-native-file-access';
import VersionCheck from 'react-native-version-check';
const BoxInHomeScreen = createContext();
// const InfoDownloaded = createContext(); //
const RefOfHome = createContext(); //
// const RefOfSearchLaw = createContext(); //
// const RefOfSearchContent = createContext(); //

import Toast, { BaseToast } from 'react-native-toast-message';

const toastConfig = {
  success: props => (
    <BaseToast
      text1={props.text1} // 👈 Quan trọng
      text2={props.text2} // 👈 Quan trọng
      style={{
        borderLeftColor: '#4CAF50',
        backgroundColor: '#000000ff',
        borderRadius: 12,
        padding: 0,
        height: 40,
        // paddingVertical: 5,
        width: '70%',
        opacity: 0.7,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
      }}
      // text2Style={{
      //   color: 'white',
      //   fontSize: 14,
      //   marginTop: 2
      // }}
    />
  ),
  copyToast: props => <ToastCustom {...props} />,
};

import Ionicons from 'react-native-vector-icons/Ionicons';

const ToastCustom = ({ text1, text2 }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
        paddingLeft: 10,
        paddingRight: 10,
        backgroundColor: 'rgba(0,0,0,0.85)',
        // opacity: 0.9,
        borderRadius: 14,
      }}
    >
      <Ionicons
        name="copy-outline"
        size={22}
        color="#fff"
        style={{ marginRight: 10 }}
      />
      <View>
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{text1}</Text>
        {text2 ? <Text style={{ color: '#fff' }}>{text2}</Text> : null}
      </View>
    </View>
  );
};

function App() {
  const [updateStatus, SetUpdateStatus] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [heightNotification, setHeightNotification] = useState(0);

  const [showBoxInHomeScreen, setShowBoxInHomeScreen] = useState(false);
  const updateShowBoxInHomeScreen = data => {
    setShowBoxInHomeScreen(data);
  };

  async function getPolicyAppear() {
    if (await FileSystem.exists(Dirs.CacheDir + '/Appear.txt', 'utf8')) {
      return false;
    } else {
      return true;
    }
  }

  async function exitUpdate() {
    const latestVersion = await VersionCheck.getLatestVersion();

    if (await FileSystem.exists(Dirs.CacheDir + '/Appear.txt', 'utf8')) {
      const fileAppear = await FileSystem.readFile(
        Dirs.CacheDir + '/Appear.txt',
        'utf8',
      );

      let contentAppear = JSON.parse(fileAppear);

      contentAppear[latestVersion] = false;

      const addInfo = await FileSystem.writeFile(
        Dirs.CacheDir + '/Appear.txt',
        JSON.stringify(contentAppear),
        'utf8',
      );
    }
  }

  async function acceptUpdate() {
    const latestVersion = await VersionCheck.getLatestVersion();

    if (await FileSystem.exists(Dirs.CacheDir + '/Appear.txt', 'utf8')) {
      const fileAppear = await FileSystem.readFile(
        Dirs.CacheDir + '/Appear.txt',
        'utf8',
      );

      let contentAppear = JSON.parse(fileAppear);

      contentAppear[latestVersion] = true;

      const addInfo = await FileSystem.writeFile(
        Dirs.CacheDir + '/Appear.txt',
        JSON.stringify(contentAppear),
        'utf8',
      );
    }
  }

  const checkForUpdate = async () => {
    // Lấy phiên bản hiện tại của ứng dụng
    const currentVersion = VersionCheck.getCurrentVersion();

    // Kiểm tra phiên bản mới nhất trên Google Play Store
    const latestVersion = await VersionCheck.getLatestVersion({
      packageName: 'com.lawmachine',
    });

    if (await FileSystem.exists(Dirs.CacheDir + '/Appear.txt', 'utf8')) {
      const fileAppear = await FileSystem.readFile(
        Dirs.CacheDir + '/Appear.txt',
        'utf8',
      );

      let contentAppear = JSON.parse(fileAppear);
      console.log('Number(latestVersion)', Number(latestVersion));
      console.log('Number(currentVersion)', Number(currentVersion));

      if (Number(latestVersion) > Number(currentVersion)) {
        if (!contentAppear[latestVersion]) {
          SetUpdateStatus(true);
        }
      }

      // SetUpdateStatus(true);
    }
  };

  useEffect(() => {
    getPolicyAppear().then(status => setShowPolicy(status));

    checkForUpdate();
  }, []);

  const [homeRef, setHomeRef] = useState('');
  const updateHomeRef = data => {
    setHomeRef(data);
  };

  const animated = useRef(new Animated.Value(0)).current;

  let Opacity = animated.interpolate({
    inputRange: [0, 100],
    outputRange: [0.5, 0],
  });

  let Scale = animated.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <BoxInHomeScreen.Provider
            value={{ showBoxInHomeScreen, updateShowBoxInHomeScreen }}
          >
            <RefOfHome.Provider value={{ homeRef, updateHomeRef }}>
              {(showPolicy || updateStatus) && ( 

                <>
                  <Animated.View
                    style={{
                      backgroundColor: 'black',
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      display: 'flex',
                      position: 'absolute',
                      opacity: Opacity,
                      zIndex: 100,
                    }}
                  >
                    <TouchableOpacity //overlay
                      style={{
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0,
                        display: 'flex',
                        position: 'absolute',
                        zIndex: 100,
                      }}
                    ></TouchableOpacity>
                  </Animated.View>

                  <Animated.View
                    onLayout={event => {
                      event.target.measure(
                        (x, y, width, height, pageX, pageY) => {
                          setHeightNotification(height);
                        },
                      );
                    }}
                    style={{
                      position: 'absolute',
                      // top: updateStatus ? 200 : 80,
                      // bottom: updateStatus ? 300 : 60,
                      // minHeight: updateStatus ? 210 : 500,
                      zIndex: 100,

                      top: '50%',
                      maxHeight: updateStatus ? 500 : '75%',

                      right: 50,
                      left: 50,
                      backgroundColor: 'white',
                      display: 'flex',
                      borderRadius: 20,
                      transform: [
                        { scale: Scale },
                        { translateY: -heightNotification / 2 },
                      ],
                      overflow: 'hidden',
                      shadowColor: 'black',
                      shadowOpacity: 1,
                      shadowOffset: {
                        width: 10,
                        height: 10,
                      },
                      shadowRadius: 4,
                      elevation: 20,
                    }}
                  >
                    {!updateStatus ? (
                      /* ================= POLICY ================= */
                      <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                      >
                        {/* Header */}
                        <View
                          style={{
                            alignItems: 'center',
                            marginTop: 24,
                            marginBottom: 16,
                            zIndex: 100,
                          }}
                        >
                          <Ionicons
                            name="document-text-outline"
                            size={48}
                            color="green"
                          />
                          <Text
                            style={{
                              fontSize: 26,
                              fontWeight: 'bold',
                              marginTop: 10,
                            }}
                          >
                            Lời mở đầu
                          </Text>
                        </View>

                        {/* Paragraph 1 */}
                        <Text
                          style={{
                            fontSize: 15,
                            lineHeight: 22,
                            color: '#333',
                            paddingHorizontal: 20,
                            textAlign: 'justify',
                            marginBottom: 12,
                          }}
                        >
                          Các thông tin, nội dung và dịch vụ mà{' '}
                          <Text style={{ fontWeight: 'bold' }}>
                            Sổ Tay Luật
                          </Text>{' '}
                          cung cấp chỉ mang tính chất tham khảo, nhằm đem lại
                          cho người sử dụng cái nhìn tổng quát về các quy định
                          pháp luật qua từng thời kỳ.
                        </Text>

                        {/* Paragraph 2 */}
                        <Text
                          style={{
                            fontSize: 15,
                            lineHeight: 22,
                            color: '#333',
                            paddingHorizontal: 20,
                            textAlign: 'justify',
                            marginBottom: 12,
                          }}
                        >
                          Do các quy định pháp luật có thể thay đổi, bổ sung
                          theo từng giai đoạn, người sử dụng khi áp dụng vào các
                          trường hợp cụ thể cần tham khảo ý kiến của cơ quan nhà
                          nước có thẩm quyền hoặc chuyên gia tư vấn pháp lý.
                        </Text>

                        {/* Paragraph 3 */}
                        <Text
                          style={{
                            fontSize: 15,
                            lineHeight: 22,
                            color: '#333',
                            paddingHorizontal: 20,
                            textAlign: 'justify',
                            marginBottom: 12,
                          }}
                        >
                          Mặc dù đã nỗ lực hạn chế sai sót, các nội dung pháp
                          luật được cung cấp vẫn có thể tồn tại lỗi đánh máy,
                          trình bày hoặc sai lệch về hiệu lực pháp lý. Việc sử
                          dụng ứng dụng đồng nghĩa với việc chấp nhận các thiếu
                          sót này và Sổ Tay Luật không chịu trách nhiệm pháp lý
                          đối với mọi thiệt hại phát sinh (nếu có).
                        </Text>

                        {/* Footer */}
                        <Text
                          style={{
                            fontSize: 15,
                            lineHeight: 22,
                            color: '#333',
                            paddingHorizontal: 20,
                            textAlign: 'justify',
                          }}
                        >
                          Ứng dụng được phát triển bởi tập thể{' '}
                          <Text style={{ fontWeight: 'bold' }}>
                            Pixel Places Game
                          </Text>
                          , không đại diện cho bất kỳ cơ quan nhà nước nào. Xin
                          chân thành cảm ơn sự tin tưởng và ủng hộ của quý người
                          dùng.
                        </Text>
                      </ScrollView>
                    ) : (
                      /* ================= UPDATE ================= */
                      <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                      >
                        {/* Header */}
                        <View
                          style={{
                            alignItems: 'center',
                            marginTop: 28,
                            marginBottom: 16,
                            zIndex: 100,
                          }}
                        >
                          <Ionicons
                            name="cloud-download-outline"
                            size={56}
                            color="green"
                          />
                          <Text
                            style={{
                              fontSize: 26,
                              fontWeight: 'bold',
                              marginTop: 12,
                            }}
                          >
                            Cập nhật mới
                          </Text>
                        </View>

                        {/* Content */}
                        <Text
                          style={{
                            fontSize: 16,
                            lineHeight: 22,
                            color: '#444',
                            textAlign: 'center',
                            paddingHorizontal: 24,
                          }}
                        >
                          Sổ Tay Luật đã có phiên bản mới với nhiều cải tiến và
                          tính năng hữu ích. Bạn nên cập nhật để có trải nghiệm
                          tốt nhất.
                        </Text>
                      </ScrollView>
                    )}

                    {!updateStatus ? (
                      <TouchableOpacity
                        style={{
                          backgroundColor: 'green',
                        }}
                        onPress={async () => {
                          let timeOut = setTimeout(() => {
                            setShowPolicy(false);
                            return () => {};
                          }, 100);

                          const currentVersion =
                            VersionCheck.getCurrentVersion();

                          const addContent = await FileSystem.writeFile(
                            Dirs.CacheDir + '/Appear.txt',
                            JSON.stringify({ [currentVersion]: false }),
                            'utf8',
                          );

                          Animated.timing(animated, {
                            toValue: showPolicy || updateStatus ? 100 : 0,
                            // toValue:100,
                            duration: 100,
                            useNativeDriver: false,
                          }).start();
                        }}
                      >
                        <Text
                          style={{
                            paddingBottom: 10,
                            paddingTop: 10,
                            textAlign: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: 16,
                          }}
                        >
                          Chấp nhận chính sách và tiếp tục
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={{ flexDirection: 'row', width: '100%' }}>
                        <TouchableOpacity
                          style={{
                            backgroundColor: 'green',
                            width: '50%',
                          }}
                          onPress={async () => {
                            let timeOut = setTimeout(() => {
                              setShowPolicy(false);
                              SetUpdateStatus(false);
                              return () => {};
                            }, 100);
                            exitUpdate();

                            Animated.timing(animated, {
                              toValue: showPolicy || updateStatus ? 100 : 0,
                              // toValue:100,
                              duration: 100,
                              useNativeDriver: false,
                            }).start();

                            if (Platform.OS == 'ios') {
                              Linking.openURL(
                                'https://apps.apple.com/vn/app/th%C6%B0-vi%E1%BB%87n-lu%E1%BA%ADt/id6741737005?l=vi',
                              ).catch(err =>
                                console.error('Error opening URL: ', err),
                              );
                            } else {
                              Linking.openURL(
                                'https://play.google.com/store/apps/details?id=com.lawmachine&pcampaignid=web_share',
                              ).catch(err =>
                                console.error('Error opening URL: ', err),
                              );
                            }
                          }}
                        >
                          <Text
                            style={{
                              paddingBottom: 10,
                              paddingTop: 10,
                              textAlign: 'center',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: 16,
                            }}
                          >
                            Cập nhật
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{
                            backgroundColor: 'green',
                            width: '50%',
                            borderLeftColor: 'white',
                            borderLeftWidth: 1,
                          }}
                          onPress={async () => {
                            let timeOut = setTimeout(() => {
                              setShowPolicy(false);
                              SetUpdateStatus(false);
                              return () => {};
                            }, 100);

                            acceptUpdate();
                            Animated.timing(animated, {
                              toValue: showPolicy || updateStatus ? 100 : 0,
                              duration: 100,
                              useNativeDriver: false,
                            }).start();
                          }}
                        >
                          <Text
                            style={{
                              paddingBottom: 10,
                              paddingTop: 10,
                              textAlign: 'center',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: 16,
                            }}
                          >
                            Thoát
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </Animated.View>
                </>
              )}

              <StackNavigator />
            </RefOfHome.Provider>
          </BoxInHomeScreen.Provider>
        </Provider>
        <Toast config={toastConfig} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
export { BoxInHomeScreen, RefOfHome };
