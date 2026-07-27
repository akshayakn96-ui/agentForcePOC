/*
 * Copyright (c) 2024-present, salesforce.com, inc.
 * All rights reserved.
 *
 * Bridges the native AgentforceViewProvider interface to React Native.
 * When enabled, delegates rendering of specified component types to a
 * registered React Native component via ReactRootView.
 */
package com.salesforce.android.reactagentforce.providers

import android.os.Bundle
import android.util.Log
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.facebook.react.ReactApplication
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.salesforce.android.agentforcesdk.components.models.AgentforceComponent
import com.salesforce.android.agentforcesdk.components.models.AgentforceViewProvider
import java.util.concurrent.atomic.AtomicReference

/**
 * Implements AgentforceViewProvider by delegating to a React Native component.
 * Also acts as a "Ghost" interceptor to forward component data to the UI delegate
 * when in headless mode.
 */
class BridgeViewProvider(
    private val reactContext: ReactApplicationContext
) : AgentforceViewProvider {

    /**
     * Maps component definition strings to their React Native component names.
     * Uses AtomicReference to swap the entire immutable map in one shot, so
     * `canHandle` never sees a partially-updated (empty) map during registration.
     */
    private val componentMap: AtomicReference<Map<String, String>> = AtomicReference(emptyMap())

    /** Register a 1:1 mapping of component types to React component names. */
    fun register(componentMap: Map<String, String>) {
        this.componentMap.set(componentMap.toMap())
    }

    /** Clear all registrations */
    fun reset() {
        componentMap.set(emptyMap())
    }

    val isRegistered: Boolean
        get() = componentMap.get().isNotEmpty()

    // region AgentforceViewProvider

    override fun canHandle(definition: String): Boolean {
        // In headless mode, we want to "peek" at all bot responses
        val isBotType = definition.contains("copilot/") || 
                        definition.contains("richText") || 
                        definition.contains("markdown")
        
        return componentMap.get().containsKey(definition) || isBotType
    }

    /**
     * Intercepts a component from the SDK and forwards its data to JS.
     * Called by the bridge when a headless session is active.
     */
    fun interceptComponent(view: AgentforceComponent) {
        // Ignore user messages to avoid duplication in custom UI
        if (view.definition == "copilot/endUserMessage") return

        val text = extractText(view)
        
        // If we found text OR if there are nested components we might want to see in JS
        if (text.isEmpty() && view.regions.components?.components.isNullOrEmpty()) return

        val params = Arguments.createMap().apply {
            putString("responseId", "comp_${System.currentTimeMillis()}")
            putString("message", text)
            putString("type", "component")
            putString("lightningType", view.definition)
            putBoolean("isPartial", false)
            
            // Extract choices from this component or its children
            val choices = mutableListOf<Map<String, String>>()
            findChoices(view, choices)
            if (choices.isNotEmpty()) {
                val choicesArray = Arguments.createArray()
                for (choice in choices) {
                    val choiceMap = Arguments.createMap().apply {
                        putString("label", choice["label"])
                        putString("alias", choice["alias"])
                    }
                    choicesArray.pushMap(choiceMap)
                }
                putArray("choices", choicesArray)
            }
        }

        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onAgentResponse", params)
    }

    private fun extractText(view: AgentforceComponent): String {
        val props = view.properties
        
        // Log keys for debugging in Logcat
        Log.d("BridgeViewProvider", "Extracting from ${view.definition}. Keys: ${props.keys}")

        var text = props["text"] as? String 
            ?: props["content"] as? String
            ?: props["label"] as? String
            ?: props["message"] as? String
            ?: props["value"] as? String
            ?: ""
        
        // Handle cases where the property might be a Map with a 'value' key
        if (text.isEmpty()) {
            for (key in listOf("text", "content", "message", "value")) {
                val value = props[key]
                if (value is Map<*, *>) {
                    val mapValue = value["value"] as? String
                    if (mapValue != null) {
                        text = mapValue
                        break
                    }
                }
            }
        }

        // If this is a container, look into children
        val children = view.regions.components?.components
        if (children != null) {
            for (child in children) {
                val childText = extractText(child)
                if (childText.isNotEmpty()) {
                    text = if (text.isEmpty()) childText else "$text\n$childText"
                }
            }
        }
        
        if (text.isNotEmpty()) {
            Log.d("BridgeViewProvider", "Found text: $text")
        }
        return text
    }

    private fun findChoices(view: AgentforceComponent, out: MutableList<Map<String, String>>) {
        if (view.definition == "copilot/choices") {
            val props = view.properties
            @Suppress("UNCHECKED_CAST")
            val choicesList = props["choices"] as? List<Map<String, Any>>
            choicesList?.forEach { choice ->
                out.add(mapOf(
                    "label" to (choice["label"] as? String ?: ""),
                    "alias" to (choice["alias"] as? String ?: "")
                ))
            }
        }
        
        view.regions.components?.components?.forEach { child ->
            findChoices(child, out)
        }
    }

    @Composable
    override fun GetView(modifier: Modifier, view: AgentforceComponent) {
        // Always extract data and send to JS for headless/custom UI logic
        interceptComponent(view)

        val moduleName = componentMap.get()[view.definition] ?: return
        val props = componentToBundle(view)
        AndroidView(
            modifier = modifier,
            factory = { context ->
                ReactRootView(context).apply {
                    val reactApp = reactContext.applicationContext as? ReactApplication
                    val instanceManager = reactApp?.reactNativeHost?.reactInstanceManager
                    startReactApplication(instanceManager, moduleName, props)
                }
            },
            onRelease = { view -> view.unmountReactApplication() }
        )
    }

    /** Convert AgentforceComponent to a Bundle for React Native initial properties */
    private fun componentToBundle(component: AgentforceComponent): Bundle {
        return Bundle().apply {
            putString("definition", component.definition)
            component.name?.let { putString("name", it) }
            putBundle("properties", mapToBundle(component.properties))
            // Access subcomponents via regions.components.components (older SDK structure)
            val subComponents = component.regions.components?.components
            if (subComponents != null && subComponents.isNotEmpty()) {
                val subArray = subComponents.map { componentToBundle(it) }.toTypedArray()
                putParcelableArray("subComponents", subArray)
            }
        }
    }

    /** Recursively convert a Map to a Bundle */
    private fun mapToBundle(map: Map<String, Any>): Bundle {
        return Bundle().apply {
            for ((key, value) in map) {
                when (value) {
                    is String -> putString(key, value)
                    is Int -> putInt(key, value)
                    is Long -> putLong(key, value)
                    is Double -> putDouble(key, value)
                    is Float -> putFloat(key, value)
                    is Boolean -> putBoolean(key, value)
                    is Map<*, *> -> {
                        @Suppress("UNCHECKED_CAST")
                        putBundle(key, mapToBundle(value as Map<String, Any>))
                    }
                    is List<*> -> {
                        putParcelableArray(key, listToBundleArray(value))
                    }
                    else -> putString(key, value.toString())
                }
            }
        }
    }

    /**
     * Convert a heterogeneous list to an array of Bundles.
     * Each element is wrapped in a Bundle with a "value" key for primitives,
     * or inlined for Map elements, preserving type information across the bridge.
     */
    private fun listToBundleArray(list: List<*>): Array<Bundle> {
        return list.map { item ->
            when (item) {
                is Map<*, *> -> {
                    @Suppress("UNCHECKED_CAST")
                    mapToBundle(item as Map<String, Any>)
                }
                else -> Bundle().apply {
                    when (item) {
                        is String -> putString("value", item)
                        is Int -> putInt("value", item)
                        is Long -> putLong("value", item)
                        is Double -> putDouble("value", item)
                        is Float -> putFloat("value", item)
                        is Boolean -> putBoolean("value", item)
                        is List<*> -> putParcelableArray("value", listToBundleArray(item))
                        else -> putString("value", item?.toString() ?: "")
                    }
                }
            }
        }.toTypedArray()
    }

    // endregion
}
