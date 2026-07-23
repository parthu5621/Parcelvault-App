package com.example.parcelvault.ui.admin

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.parcelvault.api.ApiClient
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboardScreen(
    onAddParcel: () -> Unit,
    onAssignLocker: () -> Unit,
    onViewParcels: () -> Unit,
    onLockerMap: () -> Unit = {},
    onVerifyPickup: () -> Unit = {},
    onSettingsClick: () -> Unit = {},
    onLogout: () -> Unit
) {
    val context = LocalContext.current

    var stats by remember {
        mutableStateOf(
            listOf(
                Triple("Total Parcels", "--", Color(0xFF3B82F6)),
                Triple("Pending",       "--", Color(0xFFF59E0B)),
                Triple("Ready",         "--", Color(0xFF10B981)),
                Triple("Collected",     "--", Color(0xFF6366F1)),
            )
        )
    }
    var recentActivity by remember { mutableStateOf<List<String>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val response = ApiClient.apiService.getAdminStats()
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()?.data
                if (data != null) {
                    stats = listOf(
                        Triple("Total Parcels", data.parcels.total.toString(), Color(0xFF3B82F6)),
                        Triple("Pending",       data.parcels.pending.toString(), Color(0xFFF59E0B)),
                        Triple("Ready",         data.parcels.ready.toString(), Color(0xFF10B981)),
                        Triple("Collected",     data.parcels.collectedToday.toString(), Color(0xFF6366F1)),
                    )
                }
            }

            val parcelsResponse = ApiClient.apiService.getParcels()
            if (parcelsResponse.isSuccessful && parcelsResponse.body()?.success == true) {
                recentActivity = parcelsResponse.body()?.data?.take(5)?.map { p ->
                    when (p.status) {
                        "ready" -> "${p.trackingId} assigned to Locker ${p.lockerLabel ?: "N/A"}"
                        "pending" -> "${p.trackingId} pending locker assignment"
                        "collected" -> "${p.trackingId} collected by ${p.studentName}"
                        else -> "${p.trackingId} is marked ${p.status}"
                    }
                } ?: emptyList()
            }
        } catch (e: Exception) {
            Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
        } finally {
            isLoading = false
        }
    }

    val adminEmail = ApiClient.userEmail ?: "admin@university.edu"

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Admin Dashboard", color = Color.White, fontWeight = FontWeight.Bold)
                        Text(adminEmail, color = Color.White.copy(alpha = 0.6f), fontSize = 12.sp)
                    }
                },
                actions = {
                    IconButton(onClick = onSettingsClick) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings", tint = Color.White)
                    }
                    IconButton(onClick = onLogout) {
                        Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = "Logout", tint = Color(0xFFEF4444))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1E1B4B))
            )
        },
        containerColor = Color(0xFF0F0A2A)
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Stats grid
            item {
                Text("Overview", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    stats.take(2).forEach { (label, value, color) ->
                        AdminStatCard(label, value, color, Modifier.weight(1f))
                    }
                }
                Spacer(Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    stats.drop(2).forEach { (label, value, color) ->
                        AdminStatCard(label, value, color, Modifier.weight(1f))
                    }
                }
            }

            // Quick actions
            item {
                Text("Quick Actions", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.height(10.dp))
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    // ── Most important action: Verify pickup ────────────────
                    AdminActionButton(
                        icon = Icons.Default.Person,
                        label = "Verify Student Pickup",
                        subtitle = "Enter OTP to verify & release parcel",
                        color = Color(0xFF10B981),
                        onClick = onVerifyPickup
                    )
                    AdminActionButton(
                        icon = Icons.Default.Add,
                        label = "Add New Parcel",
                        subtitle = "Register a new incoming parcel",
                        color = Color(0xFF3B82F6),
                        onClick = onAddParcel
                    )
                    AdminActionButton(
                        icon = Icons.Default.Lock,
                        label = "Assign Locker",
                        subtitle = "Assign a locker to a pending parcel",
                        color = Color(0xFFF59E0B),
                        onClick = onAssignLocker
                    )
                    AdminActionButton(
                        icon = Icons.AutoMirrored.Filled.List,
                        label = "View All Parcels",
                        subtitle = "Manage and release parcel records",
                        color = Color(0xFF8B5CF6),
                        onClick = onViewParcels
                    )
                    AdminActionButton(
                        icon = Icons.Default.Place,
                        label = "Locker Map",
                        subtitle = "View real-time locker availability",
                        color = Color(0xFF06B6D4),
                        onClick = onLockerMap
                    )
                    var showNotifDialog by remember { mutableStateOf(false) }
                    var targetStudentInput by remember { mutableStateOf("") }
                    var notifTitleInput by remember { mutableStateOf("") }
                    var notifMsgInput by remember { mutableStateOf("") }
                    var isSendingNotif by remember { mutableStateOf(false) }
                    val scope = rememberCoroutineScope()

                    if (showNotifDialog) {
                        AlertDialog(
                            onDismissRequest = { if (!isSendingNotif) showNotifDialog = false },
                            containerColor   = Color(0xFF1E1B4B),
                            title = { Text("📢 Send Notification to Student", color = Color.White, fontWeight = FontWeight.Bold) },
                            text  = {
                                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Text("Specify Student Name, Student ID (e.g. STU001), or leave blank for All Students:", color = Color.Gray, fontSize = 12.sp)
                                    OutlinedTextField(
                                        value       = targetStudentInput,
                                        onValueChange = { targetStudentInput = it },
                                        label       = { Text("Student Name / ID (Optional)", color = Color.Gray) },
                                        singleLine  = true,
                                        modifier    = Modifier.fillMaxWidth(),
                                        shape       = RoundedCornerShape(12.dp),
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedTextColor    = Color.White,
                                            unfocusedTextColor  = Color.White,
                                            focusedBorderColor  = Color(0xFF818CF8),
                                            unfocusedBorderColor= Color.Gray
                                        )
                                    )
                                    OutlinedTextField(
                                        value       = notifTitleInput,
                                        onValueChange = { notifTitleInput = it },
                                        label       = { Text("Notification Title *", color = Color.Gray) },
                                        singleLine  = true,
                                        modifier    = Modifier.fillMaxWidth(),
                                        shape       = RoundedCornerShape(12.dp),
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedTextColor    = Color.White,
                                            unfocusedTextColor  = Color.White,
                                            focusedBorderColor  = Color(0xFF818CF8),
                                            unfocusedBorderColor= Color.Gray
                                        )
                                    )
                                    OutlinedTextField(
                                        value       = notifMsgInput,
                                        onValueChange = { notifMsgInput = it },
                                        label       = { Text("Message Body *", color = Color.Gray) },
                                        modifier    = Modifier.fillMaxWidth().height(100.dp),
                                        shape       = RoundedCornerShape(12.dp),
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedTextColor    = Color.White,
                                            unfocusedTextColor  = Color.White,
                                            focusedBorderColor  = Color(0xFF818CF8),
                                            unfocusedBorderColor= Color.Gray
                                        )
                                    )
                                }
                            },
                            confirmButton = {
                                Button(
                                    onClick = {
                                        if (notifTitleInput.trim().isBlank() || notifMsgInput.trim().isBlank()) {
                                            Toast.makeText(context, "Title and message are required", Toast.LENGTH_SHORT).show()
                                            return@Button
                                        }
                                        isSendingNotif = true
                                        scope.launch {
                                            try {
                                                val resp = ApiClient.apiService.sendNotification(
                                                    com.example.parcelvault.api.SendNotificationRequest(
                                                        studentId = targetStudentInput.trim().ifBlank { "all" },
                                                        title     = notifTitleInput.trim(),
                                                        message   = notifMsgInput.trim()
                                                    )
                                                )
                                                if (resp.isSuccessful && resp.body()?.success == true) {
                                                    Toast.makeText(context, resp.body()?.message ?: "Notification sent! ✅", Toast.LENGTH_LONG).show()
                                                    showNotifDialog = false
                                                    targetStudentInput = ""; notifTitleInput = ""; notifMsgInput = ""
                                                } else {
                                                    Toast.makeText(context, resp.body()?.error ?: "Failed to send notification", Toast.LENGTH_SHORT).show()
                                                }
                                            } catch (e: Exception) {
                                                Toast.makeText(context, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
                                            } finally {
                                                isSendingNotif = false
                                            }
                                        }
                                    },
                                    enabled = !isSendingNotif,
                                    colors  = ButtonDefaults.buttonColors(containerColor = Color(0xFFF59E0B))
                                ) {
                                    if (isSendingNotif) CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White)
                                    else Text("Send Alert")
                                }
                            },
                            dismissButton = {
                                TextButton(onClick = { showNotifDialog = false }) { Text("Cancel", color = Color.Gray) }
                            }
                        )
                    }

                    AdminActionButton(
                        icon = Icons.Default.Notifications,
                        label = "Send Notification",
                        subtitle = "Alert student by Name or Student ID",
                        color = Color(0xFFF59E0B),
                        onClick = { showNotifDialog = true }
                    )
                }
            }

            // Recent activity
            item {
                Text("Recent Activity", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.height(10.dp))
            }
            if (recentActivity.isEmpty()) {
                item {
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B4B)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Box(modifier = Modifier.padding(16.dp), contentAlignment = Alignment.Center) {
                            Text("No recent parcel activities.", color = Color.Gray, fontSize = 13.sp)
                        }
                    }
                }
            } else {
                items(recentActivity) { activity ->
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B4B)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Text("📋", fontSize = 20.sp)
                            Text(activity, color = Color.White, fontSize = 13.sp, modifier = Modifier.weight(1f))
                        }
                    }
                }
            }

            item { Spacer(Modifier.height(16.dp)) }
        }
    }
}

@Composable
private fun AdminStatCard(label: String, value: String, color: Color, modifier: Modifier = Modifier) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.15f)),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(value, color = color, fontSize = 28.sp, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(4.dp))
            Text(label, color = Color.Gray, fontSize = 12.sp)
        }
    }
}

@Composable
private fun AdminActionButton(
    icon: ImageVector,
    label: String,
    subtitle: String,
    color: Color,
    onClick: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B4B)),
        modifier = Modifier.fillMaxWidth(),
        onClick = onClick
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(46.dp)
                    .background(color.copy(alpha = 0.2f), RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = label, tint = color, modifier = Modifier.size(24.dp))
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(label, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                Text(subtitle, color = Color.Gray, fontSize = 12.sp)
            }
                        Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = Color.Gray)
        }
    }
}
