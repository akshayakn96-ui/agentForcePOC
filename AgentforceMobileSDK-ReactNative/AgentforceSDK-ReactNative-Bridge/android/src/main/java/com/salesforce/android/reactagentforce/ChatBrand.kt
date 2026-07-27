/*
 * Copyright (c) 2026-present, salesforce.com, inc.
 * All rights reserved.
 */
package com.salesforce.android.reactagentforce

import androidx.compose.ui.graphics.Color

/**
 * Central placeholder palette for the AAA / ACG chat experience.
 *
 * Replace these values with the approved brand tokens and replace the text mark
 * in [BridgeTopAppBarBuilder] with the final logo asset when it is available.
 */
object ChatBrand {
    var Header = Color(0xFFF05637)
    var HeaderContent = Color.White
    var ChatSurface = Color(0xFFFFF7F5)
    var MarkBackground = Color(0xFF784944)
    var Accent = Color(0xFFF05637)

    // SDK-specific overrides
    var AgentMessageText = Color.Black
    var AgentAvatarBackground = Color(0xFF784944)
    var AgentAvatarIconTint = Color.White

    const val PrimaryName = "AAA"
    const val SecondaryName = "ACG"

    /**
     * Update branding colors from a map of hex strings.
     */
    fun updateColors(colors: Map<String, String>) {
        colors["header"]?.let { Header = parseHex(it) }
        colors["headerContent"]?.let { HeaderContent = parseHex(it) }
        colors["chatSurface"]?.let { ChatSurface = parseHex(it) }
        colors["markBackground"]?.let { MarkBackground = parseHex(it) }
        colors["accent"]?.let { Accent = parseHex(it) }
        
        colors["agentMessageText"]?.let { AgentMessageText = parseHex(it) }
        colors["agentAvatarBackground"]?.let { AgentAvatarBackground = parseHex(it) }
        colors["agentAvatarIconTint"]?.let { AgentAvatarIconTint = parseHex(it) }
    }

    private fun parseHex(hex: String): Color {
        return try {
            Color(android.graphics.Color.parseColor(hex))
        } catch (e: Exception) {
            Color.Unspecified
        }
    }
}
