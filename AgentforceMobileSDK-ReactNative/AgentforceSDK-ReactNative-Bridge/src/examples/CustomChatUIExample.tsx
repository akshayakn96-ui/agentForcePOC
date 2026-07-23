/**
 * Example: Building a Custom Chat UI with Agentforce Messages
 *
 * This example demonstrates how to:
 * 1. Enable message forwarding to React Native
 * 2. Listen to incoming/outgoing messages
 * 3. Send messages from React Native
 * 4. Build a custom chat UI
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import AgentforceService, {
  UIDelegate,
  AgentResponseEvent,
  UtteranceSentEvent,
} from '../services/AgentforceService';

interface ChatMessage {
  id: string;
  type: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export default function CustomChatUIExample() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    initializeChat();
    return () => {
      // Cleanup on unmount
    };
  }, []);

  const initializeChat = async () => {
    try {
      // Step 1: Enable message forwarding to receive events in React Native
      await AgentforceService.enableMessageForwarding(true);
      console.log('Message forwarding enabled');

      // Step 2: Register UI delegate to listen to messages
      const uiDelegate: UIDelegate = {
        onUtteranceSent(event: UtteranceSentEvent) {
          console.log('User utterance sent:', event.utterance);
          // Add user message to chat
          addMessage({
            id: `user-${Date.now()}`,
            type: 'user',
            text: event.utterance,
            timestamp: event.timestamp,
          });
          setInputText(''); // Clear input
        },

        onAgentResponse(event: AgentResponseEvent) {
          console.log('Agent response received:', event.message);
          // Add agent message to chat
          const messageText = event.message != null ? event.message : '';
          const messageTime = event.timestamp != null ? event.timestamp : new Date().toISOString();
          const messageId = event.responseId != null ? event.responseId : `agent-${Date.now()}`;
          addMessage({
            id: messageId,
            type: 'agent',
            text: messageText,
            timestamp: messageTime,
          });
          setIsLoading(false);
        },

        onAgentSwitch(event) {
          console.log('Switched to conversation:', event.conversationId);
          // Handle agent switch if needed
        },

        modifyUtterance(request) {
          // Optional: modify utterance before sending (e.g., trim, validate)
          return request.utterance.trim();
        },
      };

      AgentforceService.setUIDelegate(uiDelegate);
      console.log('UI delegate registered - ready to receive messages');

      // Keep this screen purely custom React Native UI.
      // Do not launch the native conversation overlay here.
      setMessages([
        {
          id: 'welcome-1',
          type: 'agent',
          text: "Hi Swetha, I'm the Digital Assistant. I can help with questions about your Membership or Insurance.",
          timestamp: new Date().toISOString(),
        },
        {
          id: 'welcome-2',
          type: 'agent',
          text: 'Please select one to get started.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  };

  const addMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
    // Auto-scroll to latest message
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) {
      return;
    }

    try {
      setIsLoading(true);
      // Note: Messages are sent through the native SDK UI overlay.
      // The user types in the native input field, and the SDK emits onUtteranceSent event
      // which triggers the handler above and displays it in the custom React Native UI.
      // This input is just for display/demo purposes.
      addMessage({
        id: `demo-user-${Date.now()}`,
        type: 'user',
        text: inputText,
        timestamp: new Date().toISOString(),
      });
      setInputText('');
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to handle message:', error);
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.headerIconButton}>
              <Text style={styles.headerIcon}>x</Text>
            </TouchableOpacity>
            <View style={styles.headerIdentityDot}>
              <Text style={styles.headerIdentityDotText}>A</Text>
            </View>
            <Text style={styles.headerOrg}>AAA • ACG</Text>
          </View>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Membership_Bot_Mobile</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerIconButton}>
                <Text style={styles.headerIcon}>i</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconButton}>
                <Text style={styles.headerIcon}>⋮</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Messages Display with Overlay Background */}
        <View style={styles.backgroundOverlay}>
          <View style={styles.overlayPattern} />
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}>
            {messages.map(message => (
              <View
                key={message.id}
                style={[
                  styles.messageRow,
                  message.type === 'user' ? styles.userMessageRow : styles.agentMessageRow,
                ]}>
                {message.type === 'agent' && (
                  <View style={styles.avatarBox}>
                    <Text style={styles.avatarText}>🤖</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    message.type === 'user' ? styles.userMessage : styles.agentMessage,
                  ]}>
                  {message.type === 'agent' && (
                    <Text style={styles.agentName}>Digital Assistant</Text>
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      message.type === 'user' ? styles.userMessageText : styles.agentMessageText,
                    ]}>
                    {message.text}
                  </Text>
                  <Text style={styles.timestamp}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="How can I help?"
            value={inputText}
            onChangeText={setInputText}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={isLoading || !inputText.trim()}>
            <Text style={styles.sendButtonText}>{isLoading ? '...' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f25430',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  header: {
    backgroundColor: '#f25430',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIdentityDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7a5a51',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerIdentityDotText: {
    color: '#f5f5f5',
    fontSize: 20,
  },
  headerOrg: {
    color: '#ffffff',
    fontSize: 16,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '500',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  headerIcon: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '400',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  backgroundOverlay: {
    flex: 1,
    position: 'relative',
  },
  backgroundImage: {
    opacity: 0.08,
  },
  overlayPattern: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(242, 84, 48, 0.04)',
    zIndex: 0,
  },
  messagesContent: {
    padding: 14,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-start',
  },
  agentMessageRow: {
    justifyContent: 'flex-start',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#d9e8fb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 4,
  },
  avatarText: {
    fontSize: 18,
  },
  messageBubble: {
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '86%',
  },
  userMessage: {
    backgroundColor: '#dce8f9',
    alignSelf: 'flex-end',
  },
  agentMessage: {
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  agentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121212',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 24,
  },
  userMessageText: {
    color: '#111111',
  },
  agentMessageText: {
    color: '#111111',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.65,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f5f5f7',
    borderTopWidth: 1,
    borderTopColor: '#dadada',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#9a9a9a',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginRight: 8,
    backgroundColor: '#f5f5f7',
    fontSize: 18,
  },
  sendButton: {
    backgroundColor: '#3478f6',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 24,
    justifyContent: 'center',
    minWidth: 72,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
