import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, FlatList, StyleSheet } from 'react-native';
import { AgentforceService } from 'react-native-agentforce';
import ChatBubble from '../components/ChatBubble';
import { ChatMessage } from '../types/chatMessage';
import ChatInput from '../components/ChatInputs';

export default function AgentforceChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    const setup = async () => {
      try {
        // 1. Ensure Agentforce is configured.
        // If the user came here directly, we might need to re-run config logic.
        const info = await AgentforceService.getConfigurationInfo();
        if (!info.configured) {
          console.log('Agentforce not configured, attempting auto-config...');
          // Add a message to UI
          addMessage('Connecting to Agentforce...', 'agent');

          // Try to get saved config and apply it
          const config = await AgentforceService.getConfiguration();
          if (config) {
            await AgentforceService.configure({
              ...config,
              type: 'service'
            });
          } else {
            addMessage('Error: Agent not configured. Please go to Settings first.', 'agent');
            setIsInitializing(false);
            return;
          }
        }

        // 2. Register your hidden fields FIRST
        const dummyPreChatFields = {
          First_Name: 'Swetha',
          Last_Name: 'Patel',
          MembershipNumber: '4290472034292005',
        };
        await AgentforceService.registerHiddenPreChatFields(dummyPreChatFields);

        // 3. Start session headlessly
        await AgentforceService.startSession();
        console.log('Headless session started');
        setIsInitializing(false);
      } catch (err) {
        console.error('Failed to initialize custom chat:', err);
        addMessage('Failed to connect to agent.', 'agent');
        setIsInitializing(false);
      }
    };

    setup();

    AgentforceService.setUIDelegate({
      // User message
      onUtteranceSent(event) {
        console.log('User Utterance Sent:', JSON.stringify(event, null, 2));
      },

      // Agent response
      onAgentResponse(event) {
        console.log('--- Agent Response Received (Delegate) ---');
        console.log(JSON.stringify(event, null, 2));

        if (event.lightningType === 'copilot/endUserMessage') {
          return; // Ignore user messages echoed by the SDK
        }

        // Skip partial/streaming messages if you only want final text
        if (event.isPartial) return;

        // 1. Extract text
        let text = event.message || "";

        // 2. Extract choices (buttons)
        let choicesList: string[] = [];
        if (event.choices && Array.isArray(event.choices)) {
          choicesList = event.choices.map((c: any) => c.label).filter(Boolean);
        }

        // 3. Customize and Add to UI
        if (text || choicesList.length > 0) {
          let customizedText = text;

          // Apply your custom string replacements
          if (customizedText.includes("Swetha")) {
            customizedText = customizedText.replace("Digital Assistant", "AI Support");
          }

          // If there are buttons, append them visually for now
          if (choicesList.length > 0) {
            const buttonsText = choicesList.map(label => `[${label}]`).join('  ');
            customizedText = customizedText
              ? `${customizedText}\n\n${buttonsText}`
              : buttonsText;
          }

          addMessage(customizedText, 'agent');
        }
      },

      onAgentSwitch(event) {
        console.log('Agent Switched Event:', JSON.stringify(event, null, 2));
      },
    });

    return () => {
      // Don't clear if you want to keep receiving events while navigating back
      // AgentforceService.clearUIDelegate();
    };
  }, []);

  function addMessage(text: string, sender: 'user' | 'agent') {
    if (!text) return;

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
