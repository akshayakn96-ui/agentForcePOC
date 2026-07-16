import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage } from '../types/chatMessage';


interface Props {
  item: ChatMessage;
}

export default function ChatBubble({ item }: Props) {
  const isUser = item.sender === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.agentContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.agentBubble]}>
        <Text style={[styles.message, { color: isUser ? '#FFF' : '#222' }]}>{item.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    paddingHorizontal: 16,
  },

  userContainer: {
    alignItems: 'flex-end',
  },

  agentContainer: {
    alignItems: 'flex-start',
  },

  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 14,
  },

  userBubble: {
    backgroundColor: '#2979FF',
  },

  agentBubble: {
    backgroundColor: '#ECECEC',
  },

  message: {
    fontSize: 16,
  },
});
