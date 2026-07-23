package com.example.parcelvault.ui.parcel

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ParcelDetailScreen(
    trackingId: String,
    description: String,
    status: String,
    deliveryService: String,
    lockerLabel: String?,
    otp: String?,
    arrivedAt: String,
    onBack: () -> Unit
) {
    val statusColor = when (status) {
        "ready"     -> Color(0xFF10B981)
        "pending"   -> Color(0xFFF59E0B)
        "collected" -> Color(0xFF6366F1)
        else        -> Color.Gray
    }

    val statusLabel = when (status) {
        "ready"     -> "Ready for Pickup ✅"
        "pending"   -> "Pending Assignment ⏳"
        "collected" -> "Collected ✓"
        else        -> status.replaceFirstChar { it.uppercase() }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Parcel Details", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1E1B4B))
            )
        },
        containerColor = Color(0xFF0F0A2A)
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Status Banner
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.horizontalGradient(listOf(Color(0xFF1E1B4B), Color(0xFF312E81))),
                        RoundedCornerShape(16.dp)
                    )
                    .padding(20.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        when (status) { "ready" -> "📦" ; "pending" -> "⏳" ; else -> "✓" },
                        fontSize = 48.sp
                    )
                    Text(statusLabel, color = statusColor, fontWeight = FontWeight.Bold, fontSize = 16.sp, modifier = Modifier.padding(top = 8.dp))
                }
            }

            // Tracking ID Card
            InfoCard(title = "Tracking ID") {
                Text(trackingId, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp, letterSpacing = 1.sp)
            }

            // Description & Service
            InfoCard(title = "Package Details") {
                Text(description, color = Color.White, fontSize = 15.sp)
                Spacer(Modifier.height(6.dp))
                Text(deliveryService, color = Color.Gray, fontSize = 13.sp)
            }

            // Arrival Time
            InfoCard(title = "Arrived") {
                Text(arrivedAt, color = Color.White, fontSize = 15.sp)
            }

            // OTP & Locker block – only show if ready
            if (status == "ready" && lockerLabel != null && otp != null) {
                var showFullScreenQR by remember { mutableStateOf(false) }

                val payloadJson = """{"system":"ParcelVault","bookingId":"$trackingId","lockerNumber":"$lockerLabel","verificationToken":"PV-TOKEN-$otp","otp":"$otp"}"""
                val qrBitmap = androidx.compose.runtime.remember(payloadJson) {
                    com.example.parcelvault.util.QRCodeGenerator.generateQRCode(payloadJson, 800, 800)
                }

                // Full Screen Zoom Dialog
                if (showFullScreenQR && qrBitmap != null) {
                    AlertDialog(
                        onDismissRequest = { showFullScreenQR = false },
                        containerColor = Color(0xFF0F0A2A),
                        title = {
                            Text("Pickup Verification QR Code", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                        },
                        text = {
                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                                androidx.compose.foundation.Image(
                                    bitmap = qrBitmap.asImageBitmap(),
                                    contentDescription = "Enlarged QR Code",
                                    modifier = Modifier
                                        .size(300.dp)
                                        .background(Color.White, RoundedCornerShape(16.dp))
                                        .padding(12.dp)
                                )
                                Spacer(Modifier.height(12.dp))
                                Text("Token: PV-TOKEN-$otp", color = Color(0xFF34D399), fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text("Present to campus admin for instant scanning", color = Color.Gray, fontSize = 12.sp, textAlign = TextAlign.Center)
                            }
                        },
                        confirmButton = {
                            Button(
                                onClick = { showFullScreenQR = false },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1))
                            ) {
                                Text("Close", fontWeight = FontWeight.Bold)
                            }
                        }
                    )
                }

                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF064E3B).copy(alpha = 0.9f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("🔐  Pickup Information", color = Color(0xFF34D399), fontWeight = FontWeight.Bold, fontSize = 15.sp, modifier = Modifier.fillMaxWidth())
                        Spacer(Modifier.height(16.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column {
                                Text("Locker", color = Color.Gray, fontSize = 12.sp)
                                Text(lockerLabel, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 22.sp)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("OTP Code", color = Color.Gray, fontSize = 12.sp)
                                Text(
                                    otp,
                                    color = Color(0xFF34D399),
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 28.sp,
                                    letterSpacing = 4.sp
                                )
                            }
                        }

                        if (qrBitmap != null) {
                            Spacer(Modifier.height(16.dp))
                            Surface(
                                onClick = { showFullScreenQR = true },
                                shape = RoundedCornerShape(16.dp),
                                color = Color.White,
                                shadowElevation = 8.dp
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier.padding(12.dp)
                                ) {
                                    androidx.compose.foundation.Image(
                                        bitmap = qrBitmap.asImageBitmap(),
                                        contentDescription = "Pickup QR Code",
                                        modifier = Modifier.size(240.dp)
                                    )
                                    Spacer(Modifier.height(6.dp))
                                    Text("🔍 Tap to enlarge full screen", color = Color.DarkGray, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                            Spacer(Modifier.height(8.dp))
                            Text("Scan QR Code at desk or present OTP above", color = Color.LightGray, fontSize = 11.sp)
                        }

                        Spacer(Modifier.height(12.dp))
                        Text(
                            "Show this OTP or QR Code at the locker kiosk to collect your parcel.",
                            color = Color(0xFF6EE7B7),
                            fontSize = 12.sp,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun InfoCard(title: String, content: @Composable () -> Unit) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B4B)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(title, color = Color.Gray, fontSize = 12.sp, modifier = Modifier.padding(bottom = 6.dp))
            content()
        }
    }
}
