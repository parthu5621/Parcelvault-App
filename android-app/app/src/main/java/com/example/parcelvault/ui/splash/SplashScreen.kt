package com.example.parcelvault.ui.splash

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material3.Text
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(onFinished: () -> Unit) {
    LaunchedEffect(Unit) {
        delay(2200)
        onFinished()
    }

    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = 0.9f, targetValue = 1.1f,
        animationSpec = infiniteRepeatable(
            animation = tween(900, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ), label = "scale"
    )

    val gradient = Brush.verticalGradient(
        listOf(Color(0xFF1E1B4B), Color(0xFF4C1D95), Color(0xFF7C3AED))
    )

    Box(
        modifier = Modifier.fillMaxSize().background(gradient),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                "📦",
                fontSize = 80.sp,
                modifier = Modifier.scale(scale)
            )
            Spacer(Modifier.height(20.dp))
            Text(
                "ParcelVault",
                fontSize = 36.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color.White,
                letterSpacing = (-1).sp
            )
            Spacer(Modifier.height(8.dp))
            Text(
                "Smart University Parcel Management",
                fontSize = 14.sp,
                color = Color.White.copy(alpha = 0.6f)
            )
        }

        // Bottom tagline
        Box(
            modifier = Modifier.fillMaxSize().padding(bottom = 40.dp),
            contentAlignment = Alignment.BottomCenter
        ) {
            Text("Secure · Fast · Reliable", color = Color.White.copy(alpha = 0.4f), fontSize = 13.sp)
        }
    }
}
