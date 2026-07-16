/*
 * Copyright (c) 2024-present, salesforce.com, inc. All rights reserved.
 *
 * Minimal custom view provider component for Agentforce SDK.
 *
 * HOW VIEW PROVIDER WIRING WORKS (3 steps):
 *
 * 1. Register this component with AppRegistry (see index.js):
 *      AppRegistry.registerComponent('CustomAgentforceView', () => CustomAgentforceView);
 *
 * 2. Tell the SDK which component types to delegate (see HomeScreen.tsx):
 *      AgentforceService.setViewProviderDelegate({
 *        componentMap: {
 *          'copilot/richText': 'CustomAgentforceView',
 *          'copilot/markdown': 'CustomAgentforceView',
 *        },
 *      });
 *
 * 3. This component receives ViewProviderComponentData as props (below).
 *    The native SDK calls canHandle(definition) -> true, then renders a
 *    RCTRootView / ReactRootView with the matching component name.
 *
 * For a richer version with nested key/value tables, see ComplexAgentforceDataView.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ViewProviderComponentData } from 'react-native-agentforce';

/** Props passed from the native BridgeViewProvider via RCTRootView / ReactRootView. */
interface CustomAgentforceViewProps {
  definition?: string;
  name?: string;
  properties?: Record<string, unknown>;
  subComponents?: ViewProviderComponentData[];
}

const CustomAgentforceView: React.FC<CustomAgentforceViewProps> = ({
  definition = 'unknown',
  properties = {},
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>A</Text>
        </View>
        <View style={styles.brandCopy}>
          <Text style={styles.brandName}>AAA · ACG</Text>
          <Text style={styles.brandSubtitle}>Agent response</Text>
        </View>
      </View>
      <Text style={styles.definitionText}>{definition}</Text>
      <Text style={styles.json} selectable>
        {JSON.stringify(properties, null, 2)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF7F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F05637',
    borderLeftWidth: 4,
    padding: 14,
    margin: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  brandMark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#784944',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  brandCopy: { flex: 1 },
  brandName: { color: '#784944', fontSize: 12, fontWeight: '700' },
  brandSubtitle: { color: '#6C5A57', fontSize: 10, marginTop: 1 },
  definitionText: {
    fontSize: 11,
    color: '#8A6A65',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  json: {
    fontSize: 12,
    color: '#30201E',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});

export default CustomAgentforceView;
