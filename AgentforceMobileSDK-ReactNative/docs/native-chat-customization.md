# Native chat customization guide

This guide describes the supported customization points for the Agentforce React
Native bridge. It focuses on the Android native chat experience, with notes where
the same capability is also available through the React Native layer.

## Supported customization points

| Area                                                                        | Supported                            | Implementation location                                  |
| --------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------- |
| Conversation header title                                                   | Yes                                  | `BridgeTopAppBarBuilder.kt`                              |
| Header colours, typography, close button, overflow menu                     | Yes                                  | `BridgeTopAppBarBuilder.kt`                              |
| Additional header actions/icons                                             | Yes                                  | `BridgeTopAppBarBuilder.kt`                              |
| App-owned background around the chat                                        | Yes                                  | `AgentforceConversationOverlay.kt`                       |
| Specific rich response components/cards                                     | Yes                                  | `setViewProviderDelegate()` and a React Native component |
| Transcript, end conversation, clear chat options                            | Yes, Service Agent                   | `serviceUISettings` passed to `configure()`              |
| Voice, multimodal input, PDF upload, multi-agent mode                       | Yes, when enabled by the SDK and org | `featureFlags` passed to `configure()`                   |
| Agent behaviour, welcome/error copy, topics, actions, knowledge, escalation | Yes, in Salesforce                   | Agentforce Builder and Messaging settings                |

## AAA / ACG starter branding in this repository

The bridge now uses a placeholder AAA / ACG treatment in every supported
app-owned chat surface:

- `ChatBrand.kt` contains the Android palette and brand names.
- `BridgeTopAppBarBuilder.kt` displays an `A` monogram and `AAA • ACG` above the
  configured agent title.
- `AgentforceConversationOverlay.kt` uses the matching light chat surface around
  the SDK-owned conversation.
- `CustomAgentforceView.tsx` renders the same treatment for overridden rich
  response components.

These are text/monogram placeholders, not official logo assets. Replace them
only after approved AAA and ACG SVG/PNG assets and usage rules are available.

## 1. Customize the Android header

`BridgeTopAppBarBuilder.kt` is an app-owned Compose implementation of the SDK
top app bar. It is the correct place to change:

- brand background and foreground colours;
- the title and title typography;
- the close button;
- extra icon actions; and
- the overflow and multi-agent selector behaviour.

Use an opaque ARGB colour value with Compose `Color`:

```kotlin
import androidx.compose.ui.graphics.Color

.background(Color(0xFFF05637))
```

`FF` is the alpha value, followed by the six-digit RGB value. Use `20.dp` for a
20 density-independent-pixel icon; Compose should normally use `dp`, not raw
pixels.

### Add a header icon

```kotlin
IconButton(onClick = { /* app action */ }) {
    Icon(
        imageVector = Icons.Filled.Info,
        contentDescription = "Help",
        tint = Color.White,
        modifier = Modifier.size(20.dp)
    )
}
```

The custom builder is installed for Employee Agents with an `agentLabel` and for
Service Agents in `AgentforceModule.configureServiceAgent()`.

## 2. Customize the host surface around the chat

`AgentforceConversationOverlay.kt` owns the full-screen container around the
SDK conversation. Set `surfaceColor` to brand the system-bar inset areas and any
space exposed around the SDK chat container.

```kotlin
val surfaceColor = Color.White
```

This does not restyle the individual SDK message bubbles, composer, or welcome
message. Those are rendered by the SDK.

## 3. Customize rich agent-response cards with React Native

The bridge can replace selected SDK component definitions with React Native
components. This is the supported way to render branded cards, product tiles,
images, callouts, or structured action output in the conversation.

1. Register the React Native component in `index.js`.
2. Register the definitions before launching a conversation.
3. Render the data passed as `definition`, `properties`, and (on Android)
   `subComponents`.

```ts
import { AppRegistry } from 'react-native';
import { AgentforceService } from 'react-native-agentforce';
import BrandedAgentCard from './src/components/BrandedAgentCard';

AppRegistry.registerComponent('BrandedAgentCard', () => BrandedAgentCard);

await AgentforceService.setViewProviderDelegate({
  componentMap: {
    'copilot/richText': 'BrandedAgentCard',
    'copilot/markdown': 'BrandedAgentCard',
  },
});
```

The existing `CustomAgentforceView.tsx` is a working starting point. Replace its
debug JSON UI with your branded layout. Do not register a definition until the
component can correctly render the data that your agent sends; otherwise the
SDK's built-in renderer is safer.

## 4. Configure Service Agent UI options

Pass these settings to `AgentforceService.configure()` for a Service Agent:

```ts
await AgentforceService.configure({
  type: 'service',
  serviceApiURL: 'https://service.example.com',
  organizationId: '00D...',
  esDeveloperName: 'MyServiceAgent',
  serviceUISettings: {
    downloadTranscript: false,
    endConversation: true,
    clearChat: false,
  },
  featureFlags: {
    enableMultiAgent: false,
    enableMultiModalInput: false,
    enablePDFUpload: false,
    enableVoice: false,
    enableCustomViewProvider: true,
  },
});
```

On Android, the bridge currently passes `downloadTranscript`, `endConversation`,
and `clearChat` to the native `ServiceUISettings`. The feature flags control
SDK capabilities and are subject to the installed SDK version and Salesforce org
configuration.

## 5. Configure the agent in Salesforce

In Agentforce Builder and Messaging settings, you can customize:

- agent role, instructions, tone, language, and safety boundaries;
- welcome and error messages;
- topics, actions, subagents, and escalation behaviour;
- knowledge/data libraries and grounding sources;
- Agent User permissions; and
- the Enhanced Chat channel, routing, and fallback queue.

See Salesforce documentation for [Service Agent setup](https://help.salesforce.com/s/articleView?id=service.service_agent_setup.htm&language=en_US&type=5) and [system messages](https://help.salesforce.com/s/articleView?id=sf.copilot_setup_system_messages.htm&language=en_US&type=5).

## Not supported by the built-in native conversation UI

The following areas are SDK-owned and have no supported bridge hook:

- a persistent logo inserted above the welcome message;
- arbitrary content inserted between chat messages;
- default bubble layout, composer layout, and message-list spacing;
- a full conversation-screen theme; and
- replacing the first welcome message with a native image asset.

For a logo-like first message, configure a welcome message in Salesforce (for
example, a temporary emoji). For branded images and structured data inside a
conversation, use a custom rich-response component. A fully custom message list
requires replacing the SDK conversation screen and owning message rendering,
streaming, input, attachments, forms, error handling, and accessibility.

## Upgrade guidance

Keep customizations in the bridge files listed above. Do not modify the
downloaded Agentforce SDK AAR: changes will be lost on an SDK upgrade and are not
supported. After any SDK upgrade, compile the Android bridge and manually test
the header, a Service Agent conversation, an Employee Agent conversation, and
each registered rich-response component.
