import { NavigationContainer } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useEffect, useContext, useRef, useState } from 'react';
import Home from '../screens/Home';
import { Detail1 } from '../screens/Detail1';
import { Detail2 } from '../screens/Detail2';
import { AIChatScreen } from '../screens/chatAI';
import { Detail5 } from '../screens/Detail5';
import { useNetInfo } from '@react-native-community/netinfo';
import { RefOfHome } from '../App';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

// ─────────────────────────────────────────────────────────────
// SearchStack
// ─────────────────────────────────────────────────────────────
const SearchStackNav = createNativeStackNavigator();

function SearchStack() {
  return (
    <SearchStackNav.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    >
      <SearchStackNav.Screen name="SearchLaw" component={Detail2} />
      <SearchStackNav.Screen name="Search" component={Detail1} />
    </SearchStackNav.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab Navigator
// Tab index: 0=Home  1=SearchStack  2=AIChat
// ─────────────────────────────────────────────────────────────
const Tab = createMaterialTopTabNavigator();

const TAB_CONFIGS = [
  {
    name: 'Home',
    label: 'Đã tải xuống',
    iconActive: 'home',
    iconInactive: 'home-outline',
    component: null, // set below
  },
  {
    name: 'SearchStack',
    label: 'Tìm kiếm',
    iconActive: 'search',
    iconInactive: 'search-outline',
    component: null,
  },
  {
    name: 'AIChat',
    label: 'Chat AI',
    iconActive: 'sparkles',
    iconInactive: 'sparkles-outline',
    component: null,
  },
];

const AppNavigators = () => {
  const insets = useSafeAreaInsets();
  const HomeScreen = useContext(RefOfHome);

  const { width } = Dimensions.get('window');
  const [widthDevice, setWidthDevice] = useState(width);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window: { width: w } }) => {
      setWidthDevice(w);
    });
    return () => sub?.remove();
  }, []);

  const tabTop    = Platform.OS === 'ios' ? -5 : (-insets.bottom / 24) * 10 - 2;
  const tabHeight = Platform.OS === 'ios' ? 67 : 48 + insets.bottom;
  const tabWidth  = widthDevice / 3 - 30;

  // ── TabItem dùng position trực tiếp ──────────────────────────
  // Native Animated chỉ hỗ trợ: opacity, transform (scale/translate/rotate)
  // KHÔNG hỗ trợ: width, height, backgroundColor → dùng scaleX thay width
  const TabItem = ({ tabIndex, label, iconActive, iconInactive, onPress, position, currentIdx }) => {
    const i = tabIndex;

    // scaleX: 0→1 thay vì width: 0→70 (ribbon cố định width=70, scale từ 0)
    const ribbonScaleX = position.interpolate({
      inputRange: [i - 1, i, i + 1],
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });
    const iconScale = position.interpolate({
      inputRange: [i - 1, i, i + 1],
      outputRange: [1, 1.2, 1],
      extrapolate: 'clamp',
    });
    const isActive = currentIdx === tabIndex;

    // translateY: đẩy label xuống dưới khi active thay vì scale (scale vẫn chiếm height)
    const labelTranslateY = position.interpolate({
      inputRange: [i - 1, i, i + 1],
      outputRange: [0, 20, 0],
      extrapolate: 'clamp',
    });
    const labelOpacity = position.interpolate({
      inputRange: [i - 1, i, i + 1],
      outputRange: [1, 0, 1],
      extrapolate: 'clamp',
    });

    // translateY cho toàn bộ content: inactive thì nhích lên, active thì về 0
    const contentTranslateY = position.interpolate({
      inputRange: [i - 1, i, i + 1],
      outputRange: [-insets.bottom/3 , -insets.bottom/3 +5, -insets.bottom/3],
      extrapolate: 'clamp',
    });

    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          height: tabHeight,
          width: tabWidth,
          overflow: 'hidden',
        }}
      >
        <TouchableOpacity
          style={{
            width: tabWidth,
            height: tabHeight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={onPress}
        >
          <Animated.View
            style={{
              alignItems: 'center',
              transform: [{ translateY: contentTranslateY }],
            }}
          >
            {/* icon + ribbon */}
            <Animated.View style={{ alignItems: 'center', transform: [{ scale: iconScale }] }}>
              <Animated.View
                style={{
                  width: 70,
                  height: 29,
                  borderRadius: 10,
                  backgroundColor: '#996600',
                  position: 'absolute',
                  alignSelf: 'center',
                  transform: [{ scaleX: ribbonScaleX }],
                }}
              />
              <Ionicons
                name={isActive ? iconActive : iconInactive}
                style={isActive ? styles.IconActive : styles.IconInActive}
              />
            </Animated.View>

            {/* label — fade + slide khi active */}
            <Animated.Text
              style={{
                color: 'black',
                fontSize: 11,
                fontWeight: 'bold',
                marginTop: 2,
                opacity: labelOpacity,
                transform: [{ translateY: labelTranslateY }],
              }}
            >
              {label}
            </Animated.Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        backBehavior="none"
        tabBar={({ navigation, state, position }) => {
          const idx = state.index;

          // scroll-to-top khi bấm lại tab đang active
          if (state.index === Math.round(position._value)) {
            if (idx === 0 && HomeScreen.homeRef)
              HomeScreen.homeRef.scrollToOffset({ offset: 0 });
            if (idx === 1 && global.SearchLawRef)
              global.SearchLawRef.scrollToOffset({ offset: 0 });
            if (idx === 2 && global.SearchContentRef)
              global.SearchContentRef.scrollToOffset({ offset: 0 });
          }

          return (
            <View
              style={{
                flexDirection: 'row',
                bottom: Platform.OS === 'ios' ? 0 : -5,
                position: 'absolute',
                width: '100%',
                justifyContent: 'space-evenly',
                alignItems: 'stretch',
                height: tabHeight,
                borderTopRightRadius: 15,
                borderTopLeftRadius: 15,
                backgroundColor: '#F8BD2D',
                overflow: 'hidden',
              }}
            >
              <TabItem
                tabIndex={0}
                label="Đã tải xuống"
                iconActive="home"
                iconInactive="home-outline"
                position={position}
                currentIdx={idx}
                onPress={() => navigation.navigate('Home')}
              />

              <TabItem
                tabIndex={1}
                label="Tìm kiếm"
                iconActive="search"
                iconInactive="search-outline"
                position={position}
                currentIdx={idx}
                onPress={() => navigation.navigate('SearchStack')}
              />

              <TabItem
                tabIndex={2}
                label="Chat AI"
                iconActive="sparkles"
                iconInactive="sparkles-outline"
                position={position}
                currentIdx={idx}
                onPress={() => navigation.navigate('AIChat')}
              />
            </View>
          );
        }}
        tabBarPosition="bottom"
        screenOptions={{
          tabBarPressColor: '#FFCC66',
          animationEnabled: false,
          lazy: false,
          tabBarIndicatorStyle: { display: 'none' },
        }}
      >
        <Tab.Screen
          name="Home"
          component={Home}
          options={{ header: () => null, tabBarLabel: () => null }}
        />
        <Tab.Screen
          name="SearchStack"
          component={SearchStack}
          options={{
            header: () => null,
            tabBarLabel: () => null,
            swipeEnabled: true,
          }}
        />
        <Tab.Screen
          name="AIChat"
          component={AIChatScreen}
          options={{
            header: () => null,
            tabBarLabel: () => null,
            swipeEnabled: true,
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// Root Stack
// ─────────────────────────────────────────────────────────────
const Stack = createNativeStackNavigator();

const StackNavigator = () => {
  const netInfo = useNetInfo();
  const dispatch = useDispatch();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: 'green' },
          headerBlurEffect: 'extraLight',
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="HomeStack"
          component={AppNavigators}
          options={{ header: () => null }}
        />
        <Stack.Screen
          name="accessLaw"
          component={Detail5}
          options={{
            headerTitleAlign: 'center',
            animation: 'simple_push',
            animationTypeForReplace: 'push',
            header: () => null,
          }}
        />
        <Stack.Screen
          name="SearchContent"
          component={Detail1}
          options={{ header: () => null, animation: 'simple_push' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  IconActive: {
    fontSize: 24,
    color: 'white',
    padding: 0,
    margin: 0,
    lineHeight: 28,
  },
  IconInActive: {
    fontSize: 24,
    color: 'black',
    padding: 0,
    lineHeight: 23,
  },
  TextActive: {
    fontSize: 24,
    color: 'black',
    padding: 0,
    margin: 0,
    lineHeight: 10,
  },
  TextInActive: {
    fontSize: 24,
    color: 'black',
    padding: 0,
    lineHeight: 10,
  },
  IconInfo: {
    fontSize: 30,
    color: 'white',
  },
  iconInfoContainer: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
  },
});

export default StackNavigator;