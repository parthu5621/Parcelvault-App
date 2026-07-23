package com.example.parcelvault.ui.onboarding

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private data class OnboardPage(
    val emoji: String,
    val title: String,
    val subtitle: String,
    val gradient: List<Color>
)

private val pages = listOf(
    OnboardPage(
        "📦",
        "Track Your Parcels",
        "Get instant notifications when your deliveries arrive at the campus locker room.",
        listOf(Color(0xFF1E1B4B), Color(0xFF3730A3))
    ),
    OnboardPage(
        "🔐",
        "Secure OTP Pickup",
        "Collect your parcel safely using a unique one-time password — no waiting in queues.",
        listOf(Color(0xFF064E3B), Color(0xFF065F46))
    ),
    OnboardPage(
        "🗄️",
        "Smart Locker System",
        "Lockers are automatically assigned based on parcel size. View availability in real-time.",
        listOf(Color(0xFF1E3A5F), Color(0xFF1D4ED8))
    ),
)

@Composable
fun OnboardingScreen(onFinished: () -> Unit) {
    var page by remember { mutableIntStateOf(0) }
    val current = pages[page]

    val gradient = Brush.verticalGradient(current.gradient + listOf(Color(0xFF0F0A2A)))

    Box(
        modifier = Modifier.fillMaxSize().background(gradient)
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Spacer(Modifier.height(40.dp))

            // Animated page content
            AnimatedContent(
                targetState = page,
                transitionSpec = {
                    slideInHorizontally { it } togetherWith slideOutHorizontally { -it }
                },
                label = "page"
            ) { pg ->
                val p = pages[pg]
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(p.emoji, fontSize = 90.sp)
                    Spacer(Modifier.height(32.dp))
                    Text(
                        p.title,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White,
                        textAlign = TextAlign.Center
                    )
                    Spacer(Modifier.height(16.dp))
                    Text(
                        p.subtitle,
                        fontSize = 15.sp,
                        color = Color.White.copy(alpha = 0.7f),
                        textAlign = TextAlign.Center,
                        lineHeight = 24.sp
                    )
                }
            }

            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                // Dot indicators
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    pages.indices.forEach { i ->
                        Box(
                            modifier = Modifier
                                .clip(CircleShape)
                                .background(if (i == page) Color.White else Color.White.copy(alpha = 0.3f))
                                .size(if (i == page) 24.dp else 8.dp, 8.dp)
                        )
                    }
                }

                Spacer(Modifier.height(32.dp))

                // Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (page < pages.lastIndex) {
                        TextButton(onClick = onFinished) {
                            Text("Skip", color = Color.White.copy(alpha = 0.5f))
                        }
                    } else {
                        Spacer(Modifier.width(64.dp))
                    }

                    Button(
                        onClick = {
                            if (page < pages.lastIndex) page++
                            else onFinished()
                        },
                        shape = RoundedCornerShape(50.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White),
                        modifier = Modifier.height(52.dp).width(140.dp)
                    ) {
                        Text(
                            if (page < pages.lastIndex) "Next →" else "Get Started",
                            color = Color(0xFF1E1B4B),
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                    }
                }

                Spacer(Modifier.height(16.dp))
            }
        }
    }
}
