package com.salesforce.android.reactagentforce

import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.compose.ui.platform.ComposeView
import androidx.lifecycle.setViewTreeLifecycleOwner
import androidx.lifecycle.setViewTreeViewModelStoreOwner
import androidx.savedstate.setViewTreeSavedStateRegistryOwner
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * A "Headless" observer component that renders the Agentforce SDK container 
 * with 0 size. This triggers the SDK's internal Compose logic and ViewProvider,
 * allowing our bridge to intercept messages without showing the SDK's UI.
 */
class AgentforceHeadlessObserverManager : SimpleViewManager<FrameLayout>() {

    override fun getName(): String = "AgentforceHeadlessObserver"

    override fun createViewInstance(reactContext: ThemedReactContext): FrameLayout {
        val root = FrameLayout(reactContext)
        // Keep it hidden and non-interactive
        root.layoutParams = ViewGroup.LayoutParams(1, 1)
        root.visibility = View.VISIBLE
        root.alpha = 0.01f // Almost transparent

        val activity = reactContext.currentActivity ?: return root
        if (activity is androidx.activity.ComponentActivity) {
            val composeView = ComposeView(reactContext).apply {
                setViewTreeLifecycleOwner(activity)
                setViewTreeViewModelStoreOwner(activity)
                setViewTreeSavedStateRegistryOwner(activity)
                
                setContent {
                    val client = AgentforceClientHolder.agentforceClient
                    val conversation = AgentforceClientHolder.currentConversation
                    
                    if (client != null && conversation != null) {
                        client.AgentforceConversationContainer(
                            conversation = conversation,
                            onClose = { /* No-op in headless */ }
                        )
                    }
                }
            }
            root.addView(composeView, FrameLayout.LayoutParams(1, 1))
        }

        return root
    }
}
