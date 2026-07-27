import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, FlatList, StyleSheet } from 'react-native';
import { AgentforceService } from 'react-native-agentforce';
import ChatBubble from '../components/ChatBubble';
import { ChatMessage } from '../types/chatMessage';
import ChatInput from '../components/ChatInputs';

export default function AgentforceChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [_isSending, setIsSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  console.log('Rendering AgentforceChatScreen with messages:', messages);

  useEffect(() => {
    let isMounted = true;

    const initializeChat = async () => {
      await AgentforceService.enableMessageForwarding(true);

      AgentforceService.setUIDelegate({
        onUtteranceSent(event) {
          if (!isMounted) {
            return;
          }
          addMessage(event.utterance, 'user');
          setIsSending(false);
        },

        onAgentResponse(event) {
          if (!isMounted) {
            return;
          }

          console.log('Agent Response', event);
          const messageText = event.message ?? '';
          if (messageText.trim().length > 0) {
            addMessage(messageText, 'agent');
          }
          setIsSending(false);
        },

        onAgentSwitch(event) {
          console.log(event);
        },
      });

      const configured = await AgentforceService.isConfigured();
      if (configured) {
        await AgentforceService.startConversationSession();
      }
    };

    initializeChat().catch(error => {
      console.error('Failed to initialize Agentforce chat screen:', error);
      setIsSending(false);
    });

    return () => {
      isMounted = false;
      AgentforceService.clearUIDelegate();
      AgentforceService.enableMessageForwarding(false).catch(() => {
        // no-op
      });
    };
  }, []);

  function addMessage(text: string, sender: 'user' | 'agent') {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString() + Math.random(),
        text,
        sender,
        createdAt: Date.now(),
      },
    ]);

    setTimeout(() => {
      listRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);
  }

  const onSend = async (text: string) => {
    const value = text.trim();
    if (!value) {
      return;
    }

    try {
      setIsSending(true);
      await AgentforceService.sendMessage(value);
      // User and agent bubbles are added from delegate callbacks.
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={listRef}
        data={messages}
        renderItem={({ item }) => <ChatBubble item={item} />}
        keyExtractor={item => item.id}
      />

      <ChatInput onSend={onSend} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
});
