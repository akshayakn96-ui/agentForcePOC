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
    val Header = Color(0xFFF05637)
    val HeaderContent = Color.White
    val ChatSurface = Color(0xFFFFF7F5)
    val MarkBackground = Color(0xFF784944)
    val Accent = Color(0xFFF05637)

    const val PrimaryName = "AAA"
    const val SecondaryName = "ACG"
}
