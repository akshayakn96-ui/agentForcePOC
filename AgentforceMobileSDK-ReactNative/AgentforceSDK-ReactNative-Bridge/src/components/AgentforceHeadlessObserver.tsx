import { requireNativeComponent, ViewProps } from 'react-native';

/**
 * A headless observer component that enables custom chat UIs.
 * Renders the Agentforce SDK container invisibly to trigger message events.
 */
const AgentforceHeadlessObserver = requireNativeComponent<ViewProps>('AgentforceHeadlessObserver');

export default AgentforceHeadlessObserver;
