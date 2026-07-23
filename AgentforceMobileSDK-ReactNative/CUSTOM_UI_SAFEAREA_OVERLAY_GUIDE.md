# Custom Chat UI: SafeAreaView & Overlay Background Implementation

## Overview

Updated `CustomChatUIExample.tsx` with proper SafeAreaView integration and overlay background pattern behind messages.

## Changes Implemented

### 1. SafeAreaView Integration ✅

**File:** `AgentforceSDK-ReactNative-Bridge/src/examples/CustomChatUIExample.tsx`

SafeAreaView now properly wraps the entire chat interface:

```typescript
<SafeAreaView style={styles.safeArea}>
  <KeyboardAvoidingView
    style={styles.container}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    {/* Header */}
    {/* Messages with Background Overlay */}
    {/* Input Area */}
  </KeyboardAvoidingView>
</SafeAreaView>
```

**Benefits:**

- ✅ Automatically handles iOS notch/status bar spacing
- ✅ Automatically handles Android navigation bar spacing
- ✅ Respects safe insets on all device types
- ✅ Combined with KeyboardAvoidingView for proper input handling

### 2. Overlay Background Pattern ✅

**File:** `AgentforceSDK-ReactNative-Bridge/src/examples/CustomChatUIExample.tsx`

Messages container now includes a subtle overlay background:

```typescript
{
  /* Messages Display with Overlay Background */
}
<View style={styles.backgroundOverlay}>
  <View style={styles.overlayPattern} />
  <ScrollView
    ref={scrollViewRef}
    style={styles.messagesContainer}
    contentContainerStyle={styles.messagesContent}>
    {/* Messages rendered here */}
  </ScrollView>
</View>;
```

**Styles:**

```typescript
backgroundOverlay: {
  flex: 1,
  position: 'relative',
},
overlayPattern: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(242, 84, 48, 0.04)',  // Subtle orange tint
  zIndex: 0,
},
messagesContainer: {
  flex: 1,
  backgroundColor: 'transparent',
  zIndex: 1,  // Messages display above overlay
},
```

**Customization Options:**

#### Option 1: Custom Background Image (Recommended)

To use your custom background image (e.g., stars/hearts pattern):

1. Create `assets` folder in project root:

```bash
mkdir -p src/assets
```

2. Add your image file:

```bash
cp your-pattern-image.png src/assets/chat-overlay-pattern.png
```

3. Update `overlayPattern` style to use Image component:

```typescript
import { Image } from 'react-native';

// In styles:
overlayPattern: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(242, 84, 48, 0.04)',
},

// In JSX, replace the View with:
<Image
  source={require('../assets/chat-overlay-pattern.png')}
  style={{
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,  // Adjust opacity to keep text readable
  }}
/>
```

#### Option 2: Gradient Background

```typescript
import LinearGradient from 'react-native-linear-gradient';

// In JSX:
<LinearGradient
  colors={['rgba(242, 84, 48, 0.05)', 'rgba(242, 84, 48, 0.02)']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={StyleSheet.absoluteFillObject}
/>;
```

#### Option 3: Pattern Using SVG

```typescript
import Svg, { Pattern, Rect, Circle } from 'react-native-svg';

// Create repeating pattern SVG
```

## Layout Hierarchy

```
SafeAreaView (respects statusbar/navbar)
└── KeyboardAvoidingView (handles keyboard appearing/disappearing)
    ├── Header (orange #f25430 background)
    │   ├── Close button, identity dot, org name
    │   └── Title, info button, menu button
    │
    └── backgroundOverlay (flex: 1, position: relative)
        ├── overlayPattern (absolute, full size, low opacity)
        │   └── rgba(242, 84, 48, 0.04) background
        │
        └── ScrollView (messages container, zIndex: 1)
            └── Message bubbles (displayed above overlay)

    └── Input Area (fixed bottom)
        ├── TextInput
        └── Send Button (#3478f6)
```

## Testing Checklist

- [ ] **SafeAreaView**: Content doesn't overlap with statusbar or navigation bar
- [ ] **Overlay Pattern**: Subtle orange tint visible behind messages
- [ ] **Message Visibility**: Text remains readable with overlay background
- [ ] **Keyboard Behavior**: Input pushes up when keyboard appears
- [ ] **Custom Image**: Background image displays if provided
- [ ] **Message Scrolling**: Messages scroll smoothly over overlay
- [ ] **Responsive**: Works on various screen sizes

## Navigation Flow

1. Home Screen → "Service Agent" button
2. `handleLaunchServiceAgent()` enables message forwarding
3. `navigation.navigate('CustomChat')` routes to CustomChatUIExample
4. CustomChat screen displays with:
   - ✅ SafeAreaView wrapping entire interface
   - ✅ Orange header with title and action buttons
   - ✅ Overlay background pattern behind messages
   - ✅ Message bubbles (agent/user with different styling)
   - ✅ Input area at bottom with Send button

## Message Event Integration

Messages are forwarded from native SDK through React Native event emitters:

```typescript
// Message forwarding enabled in HomeScreen.tsx
await AgentforceService.enableMessageForwarding(true);

// Events listened in CustomChatUIExample.tsx
AgentforceService.setUIDelegate({
  onAgentResponse(response) {
    // Add agent messages to UI
    addMessage({
      id: response.responseId,
      type: 'agent',
      text: response.message,
      timestamp: new Date().toISOString(),
    });
  },
  onUtteranceSent(event) {
    // Add user messages to UI
    addMessage({
      id: event.utterance,
      type: 'user',
      text: event.utterance,
      timestamp: new Date().toISOString(),
    });
  },
});
```

## Styling Reference

### Colors

- Orange Header: `#f25430` (Salesforce brand)
- User Message Background: `#dce8f9` (light blue)
- Send Button: `#3478f6` (blue)
- Overlay Pattern: `rgba(242, 84, 48, 0.04)` (subtle orange)

### Dimensions

- Header Height: ~100px (flexible based on content)
- Avatar Box: 38x38px
- Message Bubble Padding: 16px horizontal, 12px vertical
- Border Radius: 22px (messages), 12px (avatars)

## Files Modified

1. **CustomChatUIExample.tsx**

   - Added SafeAreaView wrapper
   - Added overlayPattern View with semi-transparent orange background
   - Updated backgroundOverlay and messagesContainer styling
   - Verified z-index layering for proper message display

2. **App.tsx**
   - CustomChat route configured with `headerShown: false`
   - Allows custom header in CustomChatUIExample to display

## Future Enhancements

1. **Dynamic Overlay Image**: Allow user to upload custom background pattern
2. **Overlay Opacity Control**: Toggle overlay visibility with settings
3. **Theme Support**: Light/Dark mode for overlay and header colors
4. **Animation**: Fade-in animation for messages
5. **Swipe Back Gesture**: Implement swipe to go back to Home

## Troubleshooting

### SafeAreaView Not Working

- Ensure `<SafeAreaView>` is wrapping the entire screen
- Verify `useSafeAreaInsets()` is available if using Hooks
- Check React Navigation version compatibility

### Overlay Pattern Not Visible

- Verify `overlayPattern` View is inside `backgroundOverlay`
- Check z-index: pattern should be 0, messages should be 1
- Adjust opacity if pattern is too faint

### Messages Appearing Behind Overlay

- Ensure ScrollView has `zIndex: 1`
- Verify `backgroundColor: 'transparent'` on messagesContainer
- Check that absoluteFillObject is applied correctly to overlayPattern

## Support

For issues or feature requests, refer to:

- [Message API Guide](./MESSAGE_API_GUIDE.md)
- [React Native SafeAreaView Docs](https://reactnative.dev/docs/safeareaview)
- Agentforce SDK Documentation
