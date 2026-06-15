import React, { useEffect, useState, useRef, memo, useCallback } from 'react';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Animated,
  FlatList,
  Easing,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBarHeight } from '../hooks/useTabBarHeight';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const API_URL =
  'https://us-central1-project2-197c0.cloudfunctions.net/askLawAI';

/* ─────────────────────────── INITIAL DATA ─────────────────────────── */
const INITIAL_MESSAGES = [
  {
    id: '0',
    role: 'assistant',
    text: 'Xin chào! Tôi là trợ lý tư vấn pháp luật AI. Bạn có thể hỏi tôi bất kỳ điều gì về pháp luật Việt Nam.',
    timestamp: new Date(Date.now() - 60000),
  },
];

/* ─────────────────────────── UTILS ─────────────────────────── */
const formatTime = date => {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

/* ─────────────────────────── TYPING INDICATOR ─────────────────────────── */
const TypingIndicator = memo(() => {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, {
            toValue: 1,
            duration: 320,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 320,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.delay((2 - i) * 160),
        ]),
      ),
    );
    Animated.parallel(animations).start();
    return () => animations.forEach(a => a.stop());
  }, []);

  return (
    <View style={styles.typingBubble}>
      <View style={styles.typingDots}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                transform: [
                  {
                    translateY: dot.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5],
                    }),
                  },
                ],
                opacity: dot.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 1],
                }),
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
});

/* ─────────────────────────── MESSAGE BUBBLE ─────────────────────────── */
const MessageBubble = memo(({ item }) => {
  const isUser = item.role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isUser ? styles.messageRowUser : styles.messageRowAssistant,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {!isUser && (
        <View style={styles.avatar}>
          <Ionicons name="sparkles" size={14} color="#fff" />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant,
          ]}
        >
          {item.text}
        </Text>
        <Text
          style={[
            styles.timestamp,
            isUser ? styles.timestampUser : styles.timestampAssistant,
          ]}
        >
          {formatTime(item.timestamp)}
        </Text>
      </View>
    </Animated.View>
  );
});

/* ─────────────────────────── MAIN SCREEN ─────────────────────────── */
export const AIChatScreen = () => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();

  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const xhrRef = useRef(null); // giữ ref XHR để có thể huỷ nếu cần
  

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  /* ── Streaming qua XMLHttpRequest (tương thích mọi RN version) ───── */
  const streamAIResponse = useCallback((userText, history) => {
    setIsTyping(true);
    setIsStreaming(true);

    const assistantId = `ai-${Date.now()}`;
    let firstChunk = true;
    let processedLength = 0; // theo dõi đã xử lý đến đâu trong responseText

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.open('POST', API_URL);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = () => {
      // readyState 3 = đang nhận data (streaming)
      // readyState 4 = hoàn tất

      console.log('[XHR] readyState:', xhr.readyState, '| status:', xhr.status);
      console.log('[XHR] responseText length:', xhr.responseText?.length);
      console.log(
        '[XHR] responseText mới:',
        xhr.responseText?.slice(processedLength),
      );
      if (xhr.readyState < 3) return;

      if (xhr.status !== 200 && xhr.readyState === 4) {
        setIsTyping(false);
        setIsStreaming(false);
        setMessages(prev => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            text: `Lỗi server: HTTP ${xhr.status}`,
            timestamp: new Date(),
          },
        ]);
        return;
      }

      // Chỉ xử lý phần MỚI chưa đọc
      const newText = xhr.responseText.slice(processedLength);
      processedLength = xhr.responseText.length;

      // Tách từng dòng SSE
      const lines = newText.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (!data || data === '[DONE]') continue;

        try {
          const json = JSON.parse(data);
          if (json.error) {
            throw new Error(json.error);
          }

          const chunk = json.text;
          if (!chunk) continue;

          if (firstChunk) {
            // Chunk đầu tiên: tắt typing, tạo message mới
            setIsTyping(false);
            firstChunk = false;
            setMessages(prev => [
              ...prev,
              {
                id: assistantId,
                role: 'assistant',
                text: chunk,
                timestamp: new Date(),
              },
            ]);
          } else {
            // Nối chunk vào message đang hiển thị
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantId
                  ? { ...msg, text: msg.text + chunk }
                  : msg,
              ),
            );
          }
        } catch (_) {}
      }

      // readyState 4 = stream kết thúc
      if (xhr.readyState === 4) {
        setIsTyping(false);
        setIsStreaming(false);
      }
    };

    xhr.onerror = () => {
      setIsTyping(false);
      setIsStreaming(false);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: 'Không thể kết nối đến server. Kiểm tra lại mạng.',
          timestamp: new Date(),
        },
      ]);
    };

    xhr.ontimeout = () => {
      setIsTyping(false);
      setIsStreaming(false);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: 'Hết thời gian chờ. Thử lại sau.',
          timestamp: new Date(),
        },
      ]);
    };

    xhr.timeout = 60000; // 60 giây timeout
    xhr.send(JSON.stringify({ question: userText, history }));
  }, []);

  /* ── Gửi tin nhắn ────────────────────────────────────────────────── */
  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || isStreaming) return;

    Keyboard.dismiss();
    setInputText('');

    const history = messages
      .filter(m => m.id !== '0')
      .map(m => ({ role: m.role, content: m.text }));

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    streamAIResponse(text, history);
  }, [inputText, isStreaming, messages, streamAIResponse]);

  /* ── Render ──────────────────────────────────────────────────────── */
  const renderMessage = useCallback(
    ({ item }) => <MessageBubble item={item} />,
    [],
  );
  const keyExtractor = useCallback(item => item.id, []);

  const ListFooter = useCallback(
    () => (
      <>
        {isTyping && (
          <View style={styles.messageRow}>
            <View style={styles.avatar}>
              <Ionicons name="sparkles" size={14} color="#fff" />
            </View>
            <TypingIndicator />
          </View>
        )}
        <View style={{ height: 12 }} />
      </>
    ),
    [isTyping],
  );

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: tabBarHeight },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0D0D14" />

      {/* Header */}

      <View style={styles.inputBar}>
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Nhập câu hỏi pháp luật..."
            placeholderTextColor="#4A4A68"
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit
            editable={!isStreaming}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              inputText.trim() && !isStreaming
                ? styles.sendBtnActive
                : styles.sendBtnInactive,
            ]}
            onPress={handleSend}
            activeOpacity={0.8}
            disabled={!inputText.trim() || isStreaming}
          >
            <Ionicons
              name="arrow-up"
              size={18}
              color={inputText.trim() && !isStreaming ? '#fff' : '#3A3A58'}
            />
          </TouchableOpacity>
        </View>
      </View>


      <View style={styles.headerDivider} />

      {/* Danh sách tin nhắn */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={ListFooter}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={Keyboard.dismiss}
        keyboardShouldPersistTaps="handled"
      />

      {/* Input bar */}
    </View>
  );
};

/* ─────────────────────────── STYLES ─────────────────────────── */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0D14' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0D0D14',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  headerTitle: {
    color: '#F0F0FA',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  streamingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#252540',
  },
  streamingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22D3A0',
  },
  streamingText: { color: '#22D3A0', fontSize: 11, fontWeight: '500' },

  headerDivider: { height: 1, backgroundColor: '#1E1E30' },

  listContent: { paddingHorizontal: 16, paddingTop: 12 },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 8,
  },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowAssistant: { justifyContent: 'flex-start' },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: SCREEN_WIDTH * 0.72,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: { backgroundColor: '#6C63FF', borderBottomRightRadius: 4 },
  bubbleAssistant: {
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#252540',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14.5, lineHeight: 21 },
  bubbleTextUser: { color: '#FFFFFF' },
  bubbleTextAssistant: { color: '#E0E0F4' },
  timestamp: { fontSize: 10, marginTop: 5 },
  timestampUser: { color: 'rgba(255,255,255,0.5)', textAlign: 'right' },
  timestampAssistant: { color: '#404060' },

  typingBubble: {
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#252540',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  typingDots: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#6C63FF' },

  inputBar: {
    backgroundColor: '#0D0D14',
    // borderTopWidth: 1,
    // borderTopColor: '#1E1E30',
    // borderBottomWidth: 6,
    // borderBottomColor: 'none',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: '#13131F',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#252540',
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    color: '#E8E8FA',
    fontSize: 14.5,
    lineHeight: 20,
    maxHeight: 110,
    paddingTop: Platform.OS === 'ios' ? 8 : 6,
    paddingBottom: Platform.OS === 'ios' ? 8 : 6,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#6C63FF',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  sendBtnInactive: { backgroundColor: '#1A1A2E' },
});
