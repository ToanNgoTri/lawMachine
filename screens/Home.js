import {
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
  Keyboard,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { useState, useEffect, useRef, useContext } from 'react';
import { RefOfHome,
  // BoxInHomeScreen
 } from '../App';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Dirs, FileSystem } from 'react-native-file-access';
// import {useScrollToTop} from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableFlatList, {
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import VersionCheck from 'react-native-version-check';

export default function Home({}) {
  const navigation = useNavigation();

  const [Info, setInfo] = useState(false);

  
  const [inputSearchLaw, setInputSearchLaw] = useState('');
  const [showBackground, setShowBackground] = useState(false);
  const [textInputFocus, setTextInputFocus] = useState(false);

  const insets = useSafeAreaInsets(); // lất chiều cao để menu top iphone

  const ScrollViewToScroll = useRef(null);
  const textInput = useRef(null);

  const HomeScreen = useContext(RefOfHome);

  useEffect(() => {
    if (ScrollViewToScroll.current) {
      HomeScreen.updateHomeRef(ScrollViewToScroll.current);
    }
  });

  const Render = ({ item, i, drag, isActive }) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={inputSearchLaw ? null : drag}
          disabled={isActive}
          key={i}
          style={{
            paddingBottom: 10,
            paddingTop: 10,
            justifyContent: 'center',
            backgroundColor:
              Object.values(item)[0] &&
              Object.values(item)[0]['lawNameDisplay'].match(/^(Hiến)/gim)
                ? '#da251dff'
                : 'green',
            marginBottom: 6,
            opacity: isActive ? 0.5 : 1,
          }}
          onPress={() =>
            navigation.navigate(`accessLaw`, { screen: Object.keys(item)[0] })
          }
        >
          <View style={styles.item}>
            <Text
              style={{
                ...styles.itemDisplay,
                color:
                  Object.values(item)[0] &&
                  Object.values(item)[0]['lawNameDisplay'].match(/^(Hiến)/gim)
                    ? 'yellow'
                    : 'white',
              }}
            >
              {/* {Info[item] && Info[item]['lawNameDisplay']} */}
              {Object.values(item)[0]['lawNameDisplay']}
            </Text>
            {Object.values(item)[0] &&
              !Object.values(item)[0]['lawNameDisplay'].match(
                /^(luật|bộ luật|hiến)/gim,
              ) && (
                <Text style={{ ...styles.itemDescription }}>
                  {/* {Info[item] && Info[item]['lawDescription']} */}
                  {'   '}
                  {Object.values(item)[0] &&
                    Object.values(item)[0]['lawDescription']}
                </Text>
              )}
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  useEffect(() => {
    // console.log('Object.keys(Info)', Object.keys(Info).length);
    // console.log('inputSearchLaw', inputSearchLaw);

    if (inputSearchLaw && Object.keys(Info).length) {
      // console.log(1);

      setData(
        Info &&
          Info.filter(item => {
            if (
              inputSearchLaw.match(/(\w+|\(|\)|\.|\+|\-|\,|\&|\?|\;|\!|\s?)/gim)
            ) {
              let inputSearchLawReg = inputSearchLaw;
              if (inputSearchLaw.match(/\(/gim)) {
                inputSearchLawReg = inputSearchLaw.replace(/\(/gim, '\\(');
              }

              if (inputSearchLaw.match(/\)/gim)) {
                inputSearchLawReg = inputSearchLawReg.replace(/\)/gim, '\\)');
              }
              if (inputSearchLaw.match(/\//gim)) {
                inputSearchLawReg = inputSearchLawReg.replace(/\//gim, '.');
              }
              if (inputSearchLaw.match(/\\/gim)) {
                inputSearchLawReg = inputSearchLawReg.replace(/\\/gim, '.');
              }
              if (inputSearchLaw.match(/\./gim)) {
                inputSearchLawReg = inputSearchLawReg.replace(/\./gim, '\\.');
              }
              if (inputSearchLaw.match(/\+/gim)) {
                inputSearchLawReg = inputSearchLawReg.replace(/\+/gim, '\\+');
              }
              if (inputSearchLaw.match(/\?/gim)) {
                inputSearchLawReg = inputSearchLawReg.replace(/\?/gim, '\\?');
              }

              return (
                Object.values(item)[0]['lawNameDisplay'].match(
                  new RegExp(inputSearchLawReg, 'igm'),
                ) ||
                Object.values(item)[0]['lawDescription'].match(
                  new RegExp(inputSearchLawReg, 'igm'),
                ) ||
                Object.values(item)[0]['lawNumber'].match(
                  new RegExp(inputSearchLawReg, 'igm'),
                )
              );
            }
          }),
      );

      // DeleteInternal()
    }
  }, [inputSearchLaw]);

  async function getContentExist() {
    if (await FileSystem.exists(Dirs.CacheDir + '/order.txt', 'utf8')) {
      setShowBackground(false);

      // const FileInfoStringDownloaded = await FileSystem.readFile(
      //   Dirs.CacheDir + '/downloaded.txt',
      //   'utf8',
      // );
      const FileOrder = await FileSystem.readFile(
        Dirs.CacheDir + '/order.txt',
        'utf8',
      );
      // console.log('FileOrder',FileOrder);

      if (FileOrder) {
        return {
          // content: JSON.parse(FileInfoStringDownloaded.Content),
          order: JSON.parse(FileOrder),
        };
      }
    } else {
      setShowBackground(true);
      return { order: {} };
    }
  }

  useEffect(() => {
    const listener = navigation.addListener('focus', () => {
      setInputSearchLaw('');

      getContentExist().then(cont => {
        if (!Object.keys(cont.order).length) {
          setShowBackground(true);
        } else {
          setShowBackground(false);
        }

        // console.log('cont',cont);
        if (cont) {
          setInfo(cont.order);

          // let c = []
          // cont.order.map( (item)=>{
          //   c.push(Object.keys(item)[0])
          // })
          setData(cont.order);
        } else {
          setInfo({});
          setData([]);
        }
      });
    });

    // getPolicyAppear().then(status => setShowPolicy(status));

    // checkForUpdate();
  }, []);


  const [data, setData] = useState([]);

  async function sortedData(data) {
    const addInfo = await FileSystem.writeFile(
      Dirs.CacheDir + '/order.txt',
      JSON.stringify(data),
      'utf8',
    );

    // console.log('new data',data );
  }


  function NoneOfResult() {
    return (
      <TouchableWithoutFeedback
        style={{ backgroundColor: 'red' }}
        onPress={() => Keyboard.dismiss()}
      >
        <View
          style={{
            paddingBottom: 100,
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            backgroundColor: '#EEEFE4',
          }}
        >
          <Text style={{ fontSize: 40, textAlign: 'center', color: 'gray' }}>
            {' '}
            {Info.length ? '' : 'Chưa có văn bản tải xuống'}
          </Text>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <>
      <View
        style={{
          flexDirection: 'column',
          // height: 50,
          paddingLeft: 10,
          paddingRight: 10,
          display: 'flex',
          alignItems: 'center',
          // backgroundColor:'#EEEFE4',
          justifyContent: 'space-between',
          // backgroundColor: 'red',
          flexDirection: 'column',
        }}
      >
        <View
          style={{
            backgroundColor: 'green',
            height: insets.top,
            width: '150%',
          }}
        ></View>
        <View style={{ flexDirection: 'row' }}>
          <View
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons
              name="logo-buffer"
              style={{
                color: 'green',
                fontSize: 25,
              }}
            ></Ionicons>
          </View>
          <TextInput
            onChangeText={text => {
              setInputSearchLaw(text);
            }}
            ref={textInput}
            onSubmitEditing={() => Keyboard.dismiss()}
            value={inputSearchLaw}
            style={inputSearchLaw ? styles.inputSearchArea : styles.placeholder}
            placeholder="Nhập tên, Số văn bản, Trích yếu . . ."
            placeholderTextColor={'gray'}
            onTouchEnd={() => {
              if (textInputFocus) {
                textInput.current.blur();
                setTextInputFocus(false);
              } else {
                setTextInputFocus(true);
                textInput.current.focus();
              }
            }}
            onFocus={() => setTextInputFocus(true)}
            onBlur={() => setTextInputFocus(false)}
          ></TextInput>
          <TouchableOpacity
            onPress={() => {
              setInputSearchLaw('');
              Keyboard.dismiss();
              setData(Info);
            }}
            style={{
              width: '10%',
              display: 'flex',
              // backgroundColor:'red',
              justifyContent: 'center',
            }}
          >
            {inputSearchLaw && (
              <Ionicons
                name="close-circle-outline"
                style={{
                  color: 'black',
                  fontSize: 25,
                  justifyContent: 'center',
                  textAlign: 'right',
                  // backgroundColor:'black',
                  paddingRight: 10,
                }}
              ></Ionicons>
            )}
          </TouchableOpacity>
        </View>
      </View>
      {showBackground ? (
        <NoneOfResult />
      ) : !data.length ? (
        <NoneOfResult />
      ) : (
        <View>
          <DraggableFlatList
            ref={ScrollViewToScroll}
            onScrollBeginDrag={() => Keyboard.dismiss()}
            data={data}
            renderItem={Render}
            keyExtractor={item => Object.keys(item)[0]}
            onDragEnd={({ data }) => {
              setData(data);
              sortedData(data);
            }}
            autoscrollThreshold={200}
            ListFooterComponent={() => (
              <View
                style={{
                  height: 94 + insets.bottom / 2 + insets.top,
                  width: '100%',
                }}
              ></View>
            )}
          />
        </View>
      )}

    </>
  );
}

const styles = StyleSheet.create({
  item: {
    minHeight: 100,
    display: 'flex',
    justifyContent: 'center',
    paddingLeft: 20,
    paddingRight: 20,
    flexDirection: 'column',
    // backgroundColor:'yellow',
    alignItems: 'center',
  },
  itemDisplay: {
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    fontSize: 17,
    marginBottom: 2,
  },
  itemDescription: {
    color: '#EEEEEE',
    textAlign: 'justify',
    fontSize: 15,
  },
  inputSearchArea: {
    paddingLeft: 10,
    paddingRight: 10,
    fontSize: 18,
    color: 'black',
    width: '85%',
    alignItems: 'center',
    height: 50,
  },
  placeholder: {
    fontSize: 15,
    paddingLeft: 10,
    paddingRight: 10,
    color: 'black',
    width: '85%',
    alignItems: 'center',
    height: 50,
  },
});
