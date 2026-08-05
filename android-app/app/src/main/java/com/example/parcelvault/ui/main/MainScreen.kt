package com.example.parcelvault.ui.main

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.parcelvault.ParcelDetail
import com.example.parcelvault.ui.notification.NotificationsScreen
import androidx.compose.ui.platform.LocalContext
import android.widget.Toast
import com.example.parcelvault.api.ApiClient

// ─── Data models ────────────────────────────────────────────────────────────

data class Parcel(
    val id: String,
    val trackingId: String,
    val description: String,
    val status: String,       // "pending" | "ready" | "collected"
    val deliveryService: String,
    val lockerLabel: String?,
    val otp: String?,
    val arrivedAt: String
)

// ─── Status colour helpers ───────────────────────────────────────────────────

private fun statusColor(status: String) = when (status) {
    "ready"     -> Color(0xFF10B981)  // green
    "pending"   -> Color(0xFFF59E0B)  // amber
    "collected" -> Color(0xFF6366F1)  // indigo
    else        -> Color.Gray
}

private fun statusLabel(status: String) = when (status) {
    "ready"     -> "Ready for Pickup ✅"
    "pending"   -> "Pending Assignment ⏳"
    "collected" -> "Collected ✓"
    else        -> status.replaceFirstChar { it.uppercase() }
}

// ─── Main composable ─────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    onParcelClick: (ParcelDetail) -> Unit = {},
    onLockerMapClick: () -> Unit = {},
    onSignOut: () -> Unit = {},
    onSettingsClick: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    var selectedTab by remember { mutableIntStateOf(0) }

    Scaffold(
        bottomBar = {
            NavigationBar(containerColor = Color(0xFF1E1B4B)) {
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Home, contentDescription = "Home", tint = if (selectedTab == 0) Color(0xFF818CF8) else Color.Gray) },
                    label = { Text("Home", color = if (selectedTab == 0) Color(0xFF818CF8) else Color.Gray) },
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Notifications, contentDescription = "Notifications", tint = if (selectedTab == 1) Color(0xFF818CF8) else Color.Gray) },
                    label = { Text("Alerts", color = if (selectedTab == 1) Color(0xFF818CF8) else Color.Gray) },
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Person, contentDescription = "Profile", tint = if (selectedTab == 2) Color(0xFF818CF8) else Color.Gray) },
                    label = { Text("Profile", color = if (selectedTab == 2) Color(0xFF818CF8) else Color.Gray) },
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 }
                )
            }
        },
        containerColor = Color(0xFF0F0A2A)
    ) { paddingValues ->
        when (selectedTab) {
            0 -> HomeTab(Modifier.padding(paddingValues), onParcelClick = onParcelClick, onLockerMapClick = onLockerMapClick)
            1 -> NotificationsScreen()
            2 -> ProfileTab(Modifier.padding(paddingValues), onSignOut = onSignOut, onSettingsClick = onSettingsClick)
        }
    }
}

// ─── Home tab ────────────────────────────────────────────────────────────────

@Composable
private fun HomeTab(
    modifier: Modifier = Modifier,
    onParcelClick: (ParcelDetail) -> Unit = {},
    onLockerMapClick: () -> Unit = {}
) {
    var parcels by remember { mutableStateOf<List<Parcel>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        try {
            val response = ApiClient.apiService.getParcels()
            if (response.isSuccessful && response.body()?.success == true) {
                parcels = response.body()?.data?.map { p ->
                    Parcel(
                        id = p.id,
                        trackingId = p.trackingId,
                        description = p.description,
                        status = p.status,
                        deliveryService = p.deliveryService,
                        lockerLabel = p.lockerLabel,
                        otp = p.otp,
                        arrivedAt = p.arrivedAt
                    )
                } ?: emptyList()
            } else {
                Toast.makeText(context, response.body()?.error ?: "Failed to fetch parcels", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            Toast.makeText(context, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
        } finally {
            isLoading = false
        }
    }

    val totalCount = parcels.size.toString()
    val readyCount = parcels.count { it.status.lowercase() == "ready" }.toString()
    val pendingCount = parcels.count { it.status.lowercase() == "pending" }.toString()
    val collectedCount = parcels.count { it.status.lowercase() == "collected" }.toString()
    val studentName = ApiClient.userName ?: "Student"

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF0F0A2A))
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(16.dp))
            // Header gradient card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.horizontalGradient(
                            listOf(Color(0xFF3B82F6), Color(0xFF9333EA))
                        ),
                        RoundedCornerShape(20.dp)
                    )
                    .padding(24.dp)
            ) {
                Column {
                    Text("Hello, $studentName 👋", color = Color.White.copy(alpha = 0.8f), fontSize = 14.sp)
                    Text("My Parcels", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        StatChip("Total", totalCount)
                        StatChip("Pending", pendingCount)
                        StatChip("Ready", readyCount)
                        StatChip("Collected", collectedCount)
                    }
                }
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Recent Parcels", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
                TextButton(onClick = onLockerMapClick) {
                    Text("View Lockers 🗄️", color = Color(0xFF818CF8), fontSize = 13.sp)
                }
            }
        }

        if (isLoading) {
            item {
                Box(
                    modifier = Modifier.fillMaxWidth().height(150.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = Color(0xFF818CF8))
                }
            }
        } else if (parcels.isEmpty()) {
            item {
                Box(
                    modifier = Modifier.fillMaxWidth().height(150.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No parcels found.", color = Color.Gray, fontSize = 14.sp)
                }
            }
        } else {
            items(parcels) { parcel ->
                ParcelCard(parcel, onClick = {
                    onParcelClick(ParcelDetail(
                        trackingId      = parcel.trackingId,
                        description     = parcel.description,
                        status          = parcel.status,
                        deliveryService = parcel.deliveryService,
                        lockerLabel     = parcel.lockerLabel ?: "",
                        otp             = parcel.otp ?: "",
                        arrivedAt       = parcel.arrivedAt
                    ))
                })
            }
        }

        item { Spacer(modifier = Modifier.height(16.dp)) }
    }
}

@Composable
private fun StatChip(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
        Text(label, color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp)
    }
}

@Composable
private fun ParcelCard(parcel: Parcel, onClick: () -> Unit = {}) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B4B)),
        modifier = Modifier.fillMaxWidth().clickable { onClick() }
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(parcel.trackingId, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Surface(
                    shape = RoundedCornerShape(50.dp),
                    color = statusColor(parcel.status).copy(alpha = 0.2f)
                ) {
                    Text(
                        statusLabel(parcel.status),
                        color = statusColor(parcel.status),
                        fontSize = 11.sp,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))
            Text(parcel.description, color = Color.Gray, fontSize = 13.sp)
            Text(parcel.deliveryService, color = Color.Gray, fontSize = 12.sp)

            if (parcel.status == "ready" && parcel.lockerLabel != null) {
                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = Color.White.copy(alpha = 0.1f))
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text("Locker", color = Color.Gray, fontSize = 11.sp)
                        Text(parcel.lockerLabel, color = Color.White, fontWeight = FontWeight.Bold)
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text("Your OTP", color = Color.Gray, fontSize = 11.sp)
                        Text(
                            parcel.otp ?: "--",
                            color = Color(0xFF818CF8),
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 22.sp,
                            letterSpacing = 4.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            Text("Arrived: ${parcel.arrivedAt}", color = Color.Gray, fontSize = 11.sp)
        }
    }
}

// ─── Profile tab ─────────────────────────────────────────────────────────────

@Composable
private fun ProfileTab(
    modifier: Modifier = Modifier,
    onSignOut: () -> Unit = {},
    onSettingsClick: () -> Unit = {}
) {
    val name   = ApiClient.userName  ?: "Student"
    val email  = ApiClient.userEmail ?: ""
    val initials = name.split(" ")
        .take(2)
        .joinToString("") { it.firstOrNull()?.uppercase() ?: "" }
        .ifBlank { "S" }

    var showSignOutDialog by remember { mutableStateOf(false) }

    if (showSignOutDialog) {
        AlertDialog(
            onDismissRequest = { showSignOutDialog = false },
            containerColor = Color(0xFF1E1B4B),
            title = { Text("Sign Out", color = Color.White, fontWeight = FontWeight.Bold) },
            text  = { Text("Are you sure you want to sign out?", color = Color.Gray) },
            confirmButton = {
                Button(
                    onClick = {
                        // Clear session
                        ApiClient.token     = null
                        ApiClient.userId    = null
                        ApiClient.userName  = null
                        ApiClient.userEmail = null
                        ApiClient.userRole  = null
                        showSignOutDialog = false
                        onSignOut()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444))
                ) { Text("Sign Out") }
            },
            dismissButton = {
                TextButton(onClick = { showSignOutDialog = false }) {
                    Text("Cancel", color = Color.Gray)
                }
            }
        )
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF0F0A2A))
            .padding(horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(48.dp))

        // Avatar
        Box(
            modifier = Modifier
                .size(88.dp)
                .background(
                    brush = Brush.linearGradient(listOf(Color(0xFF3B82F6), Color(0xFF9333EA))),
                    shape = RoundedCornerShape(50.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(initials, color = Color.White, fontSize = 32.sp, fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(18.dp))

        Text(name, color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(4.dp))
        Text(email, color = Color.Gray, fontSize = 14.sp)

        Spacer(modifier = Modifier.height(8.dp))

        // Role badge
        Surface(
            shape = RoundedCornerShape(50.dp),
            color = Color(0xFF3B82F6).copy(alpha = 0.2f)
        ) {
            Text(
                "🎓 Student",
                color = Color(0xFF60A5FA),
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 5.dp)
            )
        }

        Spacer(modifier = Modifier.height(36.dp))

        // Info cards
        ProfileInfoRow(label = "Account Status", value = "Active ✅")
        Spacer(modifier = Modifier.height(10.dp))
        ProfileInfoRow(label = "App Version",    value = "ParcelVault v1.0")

        Spacer(modifier = Modifier.height(36.dp))

        Button(
            onClick = onSettingsClick,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF818CF8))
        ) { Text("⚙️  Profile & Settings", fontWeight = FontWeight.SemiBold) }

        Spacer(modifier = Modifier.height(10.dp))

        OutlinedButton(
            onClick = { showSignOutDialog = true },
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(14.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFEF4444))
        ) { Text("Sign Out", color = Color(0xFFEF4444), fontWeight = FontWeight.SemiBold) }
    }
}

@Composable
private fun ProfileInfoRow(label: String, value: String) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B4B)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(label, color = Color.Gray, fontSize = 13.sp)
            Text(value, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Medium)
        }
    }
}
