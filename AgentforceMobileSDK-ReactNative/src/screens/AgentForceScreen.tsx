import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, FlatList, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { AgentforceService, AgentforceHeadlessObserver } from 'react-native-agentforce';
import ChatBubble from '../components/ChatBubble';
import { ChatMessage } from '../types/chatMessage';
import ChatInput from '../components/ChatInputs';

export default function AgentforceChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    let isMounted = true;

    // 1. Set up UI delegate FIRST
    AgentforceService.setUIDelegate({
      onAgentResponse(event) {
        if (!isMounted) return;
        console.log('--- Agent Response Received (Delegate) ---');

        if (event.lightningType === 'copilot/endUserMessage') return;
        if (event.isPartial) return;

        let text = event.message || '';
        let choicesList: string[] = [];
        if (event.choices && Array.isArray(event.choices)) {
          choicesList = event.choices.map((c: any) => c.label).filter(Boolean);
        }

        if (text || choicesList.length > 0) {
          let customizedText = text;
          if (customizedText.includes('Swetha')) {
            customizedText = customizedText.replace('Digital Assistant', 'AI Support');
          }
          if (choicesList.length > 0) {
            const buttonsText = choicesList.map(label => `[${label}]`).join('  ');
            customizedText = customizedText ? `${customizedText}\n\n${buttonsText}` : buttonsText;
          }
          addMessage(customizedText, 'agent', event.responseId);
        }
      },
      onUtteranceSent(event) {
        console.log('Utterance Sent', event);
      },
    });

    const setup = async () => {
      try {
        const info = await AgentforceService.getConfigurationInfo();
        if (!info.configured) {
          const config = await AgentforceService.getConfiguration();
          if (config && isMounted) {
            await AgentforceService.configure({ ...config, type: 'service' });
          } else {
            if (isMounted) addMessage('Error: Agent not configured.', 'agent');
            return;
          }
        }

        await AgentforceService.registerHiddenPreChatFields({
          First_Name: 'Swetha',
          Last_Name: 'Patel',
          MembershipNumber: '4290472034292005',
        });

        await AgentforceService.clearMessageCache();
        await AgentforceService.startSession();
        if (isMounted) setIsInitializing(false);
      } catch (err) {
        console.error('Setup error:', err);
        if (isMounted) setIsInitializing(false);
      }
    };

    setup();

    return () => {
      isMounted = false;
      AgentforceService.closeConversation().catch(() => {});
      AgentforceService.clearUIDelegate();
    };
  }, []);

  function addMessage(text: string, sender: 'user' | 'agent', id?: string) {
    if (!text) return;

    setMessages(prev => {
      // Deduplicate by ID in React state
      if (id && prev.some(m => m.id === id)) {
        return prev;
      }

      return [
        ...prev,
        {
          id: id || Date.now().toString() + Math.random(),
          text,
          sender,
          createdAt: Date.now(),
        },
      ];
    });

    setTimeout(() => {
      listRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);
  }

  const onSend = async (text: string) => {
    if (!text.trim() || isInitializing) return;

    console.log('Sending message headlessly:', text);

    // 1. Add to local UI immediately
    addMessage(text, 'user');

    // 2. Send to Agentforce headlessly
    try {
      await AgentforceService.sendMessage(text);
    } catch (error) {
      console.error('Failed to send message to Agentforce:', error);
      addMessage('Error: Failed to send message.', 'agent');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Invisible observer that triggers SDK events headlessly */}
      {!isInitializing && <AgentforceHeadlessObserver style={{ width: 1, height: 1, position: 'absolute', opacity: 0 }} />}

      <FlatList
        ref={listRef}
        data={messages}
        renderItem={({ item }) => <ChatBubble item={item} />}
        keyExtractor={item => item.id}
        ListFooterComponent={
          isInitializing ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator color="#0176D3" />
              <Text style={styles.loadingText}>Connecting to Agent...</Text>
            </View>
          ) : null
        }
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
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  loadingText: {
    color: '#6c757d',
    fontSize: 14,
  },
});
