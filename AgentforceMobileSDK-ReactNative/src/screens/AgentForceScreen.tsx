import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, FlatList, StyleSheet } from 'react-native';
import { AgentforceService } from 'react-native-agentforce';
import ChatBubble from '../components/ChatBubble';
import { ChatMessage } from '../types/chatMessage';
import ChatInput from '../components/ChatInputs';

export default function AgentforceChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    AgentforceService.setUIDelegate({
      // User message
      onUtteranceSent(event) {
        addMessage(event.utterance, 'user');
      },

      // Agent response
      onAgentResponse(event) {
        console.log('Agent Response', event);

        addMessage(event.message, 'agent');
      },

      onAgentSwitch(event) {
        console.log(event);
      },
    });

    return () => {
      AgentforceService.clearUIDelegate();
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

  const onSend = (text: string) => {
    /**
     * Optional:
     * If your native module exposes sendMessage()
     *
     * AgentforceService.sendMessage(text);
     */

    addMessage(text, 'user');
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
