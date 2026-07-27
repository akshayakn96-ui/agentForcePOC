import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, FlatList, StyleSheet } from 'react-native';
import { AgentforceService } from 'react-native-agentforce';
import ChatBubble from '../components/ChatBubble';
import { ChatMessage } from '../types/chatMessage';
import ChatInput from '../components/ChatInputs';

export default function AgentforceChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const didInitializeRef = useRef(false);
  const didStartSessionRef = useRef(false);
  const recentUserMessagesRef = useRef<Map<string, number>>(new Map());
  const recentAgentMessagesRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (didInitializeRef.current) {
      return;
    }
    didInitializeRef.current = true;

    // ViewProviderDelegate is registered globally in HomeScreen for choice components
    // Here we just set up the UIDelegate for message events

    AgentforceService.setUIDelegate({
      onUtteranceSent(event) {
        const text = event.utterance?.trim();
        if (!text) {
          setIsSending(false);
          return;
        }

        const signature = `${text}`;
        const now = Date.now();
        const previous = recentUserMessagesRef.current.get(signature);
        // Dedup: skip if same message sent within 30 seconds
        if (previous && now - previous < 30000) {
          setIsSending(false);
          return;
        }

        recentUserMessagesRef.current.set(signature, now);
        addMessage(text, 'user');
        setIsSending(false);
      },

      onAgentResponse(event) {
        const agentEvent = event as any;

        // Skip end-user message echoes
        if (agentEvent.lightningType === 'copilot/endUserMessage') {
          return;
        }

        // Skip partial responses
        if (agentEvent.isPartial) {
          return;
        }

        const text = agentEvent.message ?? '';
        if (!text) {
          return;
        }

        const messageSignature = text;
        const now = Date.now();
        const previous = recentAgentMessagesRef.current.get(messageSignature);
        // Dedup: skip if same message received within 30 seconds
        if (previous && now - previous < 30000) {
          return;
        }
        recentAgentMessagesRef.current.set(messageSignature, now);

        // Customize response text
        let displayText = text;
        if (displayText.includes('Digital Assistant')) {
          displayText = displayText.replace('Digital Assistant', 'AI Support');
        }

        addMessage(displayText, 'agent');
        // Note: Choice components are handled by CustomChoicesView via ViewProvider
      },

      onAgentSwitch(event) {
        console.log('Agent switched');
      },
    });

    const setup = async () => {
      try {
        const info = await AgentforceService.getConfigurationInfo();
        if (!info.configured) {
          const config = await AgentforceService.getConfiguration();
          if (config) {
            await AgentforceService.configure({
              ...config,
              type: 'service',
            });
          } else {
            addMessage('Error: Agent not configured. Please go to Settings first.', 'agent');
            setIsInitializing(false);
            return;
          }
        }

        const dummyPreChatFields = {
          First_Name: 'Swetha',
          Last_Name: 'Patel',
          MembershipNumber: '4290472034292005',
        };
        await AgentforceService.registerHiddenPreChatFields(dummyPreChatFields);

        if (!didStartSessionRef.current) {
          didStartSessionRef.current = true;
          await AgentforceService.startSession();
        }
        setIsInitializing(false);
      } catch (err) {
        console.error('Failed to initialize chat:', err);
        addMessage('Failed to connect to agent.', 'agent');
        setIsInitializing(false);
      }
    };

    setup();

    return () => {
      setMessages([]);
      didStartSessionRef.current = false;
    };
  }, []);

  function addMessage(text: string, sender: 'user' | 'agent') {
    if (!text) {
      return;
    }

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
    const trimmedText = text.trim();
    if (!trimmedText || isInitializing || isSending) {
      return;
    }

    try {
      setIsSending(true);
      // Show message immediately (optimistic update)
      addMessage(trimmedText, 'user');
      await AgentforceService.sendMessage(trimmedText);
      setIsSending(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      addMessage('Error: Failed to send message.', 'agent');
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={listRef}
        data={messages}
        style={styles.list}
        contentContainerStyle={messages.length === 0 ? styles.emptyListContent : styles.listContent}
        extraData={messages}
        renderItem={({ item }) => <ChatBubble item={item} />}
        keyExtractor={item => item.id}
        ListEmptyComponent={isInitializing ? null : <></>}
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 12,
  },
  emptyListContent: {
    flexGrow: 1,
  },
});
