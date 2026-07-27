/*
 * Custom component to render choice/button options from Agentforce SDK.
 *
 * Receives component data from the native ViewProvider and displays
 * choice buttons that can be tapped to send responses back to the agent.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import type { ViewProviderComponentData } from 'react-native-agentforce';
import { AgentforceService } from 'react-native-agentforce';

interface CustomChoicesViewProps {
  definition?: string;
  name?: string;
  properties?: Record<string, unknown>;
  subComponents?: ViewProviderComponentData[];
}

const CustomChoicesView: React.FC<CustomChoicesViewProps> = ({
  definition = 'unknown',
  properties = {},
  subComponents = [],
}) => {
  console.log('[CustomChoicesView] Rendered with:', {
    definition,
    properties,
    subComponentCount: subComponents.length,
  });

  // Try to extract choices from properties or subComponents
  let choices: Array<{ id: string; label: string; value?: string }> = [];

  // Method 1: Check if properties contains choices array
  if (Array.isArray(properties.choices)) {
    choices = (properties.choices as any[]).map((c, i) => ({
      id: c.id ?? `choice_${i}`,
      label: c.label ?? c.text ?? c.title ?? String(c),
      value: c.value ?? c.id,
    }));
  }

  // Method 2: Check if each property is a choice
  if (choices.length === 0) {
    const entries = Object.entries(properties);
    if (entries.length > 0 && entries[0][0] !== 'text') {
      // If first property isn't 'text', treat entries as choices
      choices = entries.map(([key, val]) => ({
        id: key,
        label: typeof val === 'string' ? val : String(val),
        value: key,
      }));
    }
  }

  // Method 3: Use subComponents as choices
  if (choices.length === 0 && subComponents.length > 0) {
    choices = subComponents.map((sub, i) => ({
      id: sub.definition ?? `choice_${i}`,
      label: (sub.properties?.label ?? sub.properties?.text ?? sub.definition) as string,
      value: sub.properties?.value as string,
    }));
  }

  const onChoiceSelected = async (choice: { id: string; label: string; value?: string }) => {
    console.log('[CustomChoicesView] Choice selected:', choice);
    try {
      // Send the choice value or label back to the agent
      const messageText = choice.value ?? choice.label;
      await AgentforceService.sendMessage(messageText);
    } catch (error) {
      console.error('[CustomChoicesView] Failed to send choice:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.definitionText}>Component: {definition}</Text>

      {choices.length > 0 ? (
        <ScrollView style={styles.choicesScroll} horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.choicesContainer}>
            {choices.map(choice => (
              <TouchableOpacity
                key={choice.id}
                style={styles.choiceButton}
                onPress={() => onChoiceSelected(choice)}>
                <Text style={styles.choiceButtonText}>{choice.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        <Text style={styles.noChoicesText}>No choices found in properties</Text>
      )}

      {/* Debug: Show raw data */}
      <Text style={styles.debugLabel}>Properties:</Text>
      <Text style={styles.debugText} selectable>
        {JSON.stringify(properties, null, 2)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    margin: 8,
  },
  definitionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  choicesScroll: {
    marginVertical: 8,
  },
  choicesContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  choiceButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0066CC',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  choiceButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noChoicesText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  debugLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#999',
    marginTop: 8,
  },
  debugText: {
    fontSize: 10,
    color: '#999',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
});

export default CustomChoicesView;
