# Agentforce Message API Guide

## Overview

The Agentforce message API allows you to:

- **Receive messages** from conversations (both user sent and agent responses)
- **Build custom chat UIs** that react to message events while using the SDK's native input
- **Track conversation flow** and display message history
- **Intercept and modify utterances** before they're sent

**Note:** Message sending is handled by the native Agentforce UI overlay. The message API focuses on receiving events to build custom display layers.

## Quick Start

### 1. Enable Message Forwarding

Before receiving messages, enable message forwarding:

```typescript
import AgentforceService from './services/AgentforceService';

// Enable message forwarding to React Native
await AgentforceService.enableMessageForwarding(true);
```

### 2. Listen to Messages

Register a UI delegate to receive message events:

```typescript
AgentforceService.setUIDelegate({
  onUtteranceSent(event) {
    console.log('User sent:', event.utterance);
    console.log('Timestamp:', event.timestamp);
    // Update your custom UI with user message
  },

  onAgentResponse(event) {
    console.log('Agent said:', event.message);
    console.log('Message ID:', event.responseId);
    console.log('Message type:', event.type);
    // Update your custom UI with agent message
  },

  onAgentSwitch(event) {
    console.log('Switched to conversation:', event.conversationId);
    // Handle agent switching
  },

  modifyUtterance(request) {
    // Optional: intercept and modify text before sending
    return request.utterance.trim();
  },
});
```

### 3. Launch Conversation

```typescript
await AgentforceService.launchConversation();
```

The native Agentforce overlay will appear with the conversation UI. Messages sent through the native input will trigger the `onUtteranceSent` event above.

## API Reference

### enableMessageForwarding(enabled: boolean)

Enable or disable message event forwarding.

```typescript
// Enable
await AgentforceService.enableMessageForwarding(true);

// Disable
await AgentforceService.enableMessageForwarding(false);
```

**When enabled**, the following events are emitted:

- `onUtteranceSent` - When user sends a message
- `onAgentResponse` - When agent responds
- `onAgentSwitch` - When switching agents
- `onModifyUtteranceRequest` - For utterance modification hooks

#### UtteranceSentEvent (User Message)

Emitted when a user sends a message through the native input.

```typescript
interface UtteranceSentEvent {
  utterance: string; // The message text
  hasAttachment: boolean; // Whether message has attachment
  timestamp: string; // ISO 8601 timestamp
}
```

#### AgentResponseEvent (Agent Message)

Emitted when the agent responds.

```typescript
interface AgentResponseEvent {
  responseId: string; // Unique message ID
  message: string; // Message text
  type: string; // Message type (usually "agent")
  conversationId: string; // Conversation ID
  timestamp: string; // ISO 8601 timestamp
}
```

#### AgentSwitchEvent

Emitted when switching to a different agent.

```typescript
interface AgentSwitchEvent {
  conversationId: string; // New conversation ID
  timestamp: string; // ISO 8601 timestamp
}
```

## Complete Example

See [CustomChatUIExample.tsx](./examples/CustomChatUIExample.tsx) for a complete working example of:

- Enabling message forwarding
- Building a custom chat UI with message bubbles
- Receiving and displaying messages
- Integration with the native Agentforce overlay

## Usage Patterns

### Pattern 1: Custom Chat Screen with Stored Messages

```typescript
const [messages, setMessages] = useState<ChatMessage[]>([]);

useEffect(() => {
  // Enable and register delegate
  AgentforceService.enableMessageForwarding(true);

  AgentforceService.setUIDelegate({
    onUtteranceSent(event) {
      setMessages(prev => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          type: 'user',
          text: event.utterance,
          timestamp: event.timestamp,
        },
      ]);
    },

    onAgentResponse(event) {
      setMessages(prev => [
        ...prev,
        {
          id: event.responseId,
          type: 'agent',
          text: event.message,
          timestamp: event.timestamp,
        },
      ]);
    },
  });

  AgentforceService.launchConversation();
}, []);
```

### Pattern 2: Utterance Modification/Validation

```typescript
AgentforceService.setUIDelegate({
  modifyUtterance(request) {
    // Sanitize input
    const cleaned = request.utterance.trim().replace(/[<>]/g, ''); // Remove HTML-like chars

    return cleaned;
  },

  onUtteranceSent(event) {
    // Log for analytics
    analytics.logChatMessage({
      length: event.utterance.length,
      hasAttachment: event.hasAttachment,
      timestamp: event.timestamp,
    });
  },
});
```

## Important Notes

1. **Enable forwarding before launching**: Call `enableMessageForwarding(true)` before `launchConversation()` to ensure you receive all events.

2. **Message sending is native**: Users send messages through the Agentforce SDK's native UI overlay. Your React Native code receives notifications of those events.

3. **Message history**: Messages are forwarded as they occur. You must store them yourself if you need history (see Pattern 1).

4. **Native UI coexistence**: The custom React Native message display works alongside the native overlay. Both show the same messages.

5. **Platform support**: Works on both Android and iOS.

## Troubleshooting

### Messages not appearing in custom UI

1. Ensure `enableMessageForwarding(true)` is called before `launchConversation()`
2. Check that `setUIDelegate()` was called with valid handlers
3. Verify that the UI delegate is receiving events via console.log
4. Check that the conversation was launched successfully

### No agent response after user sends message

- Verify the Agentforce configuration is correct
- Check that the conversation is fully initialized
- Review native logs for SDK errors
- Ensure the agent is available and routing is configured

### Events are firing but UI isn't updating

- Check that state is being updated correctly in onUtteranceSent/onAgentResponse
- Verify component is re-rendering when state changes
- Ensure message data structure matches UI expectations

## See Also

- [AgentforceService API](./services/AgentforceService.ts)
- [UIDelegate Type Definition](./types/UIDelegate.ts)
- [Full Example Component](./examples/CustomChatUIExample.tsx)
