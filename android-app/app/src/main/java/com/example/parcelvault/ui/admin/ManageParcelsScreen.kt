package com.example.parcelvault.ui.admin

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.parcelvault.api.ApiClient
import com.example.parcelvault.api.Parcel
import kotlinx.coroutines.launch

private fun statusColor(s: String) = when (s) {
    "ready"     -> Color(0xFF10B981)
    "pending"   -> Color(0xFFF59E0B)
    "collected" -> Color(0xFF6366F1)
    "expired"   -> Color(0xFFEF4444)
    else        -> Color.Gray
}

private fun statusEmoji(s: String) = when (s) {
    "ready"     -> "✅"
    "pending"   -> "⏳"
    "collected" -> "✓"
    "expired"   -> "❌"
    else        -> "•"
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ManageParcelsScreen(onBack: () -> Unit) {
    val context   = LocalContext.current
    val scope     = rememberCoroutineScope()

    var parcels   by remember { mutableStateOf<List<Parcel>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var tabIndex  by remember { mutableIntStateOf(0) }
    val tabs      = listOf("All", "Pending", "Ready", "Collected", "Expired")

    // Confirm-release dialog state
    var releaseTarget by remember { mutableStateOf<Parcel?>(null) }

    fun loadParcels() {
        scope.launch {
            isLoading = true
            try {
                val resp = ApiClient.apiService.getParcels()
                if (resp.isSuccessful && resp.body()?.success == true) {
                    parcels = resp.body()?.data ?: emptyList()
                } else {
                    Toast.makeText(context, resp.body()?.error ?: "Failed to load parcels", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(context, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) { loadParcels() }

    val filtered = when (tabIndex) {
        1 -> parcels.filter { it.status == "pending" }
        2 -> parcels.filter { it.status == "ready" }
        3 -> parcels.filter { it.status == "collected" }
        4 -> parcels.filter { it.status == "expired" }
        else -> parcels
    }

    // Release dialog
    releaseTarget?.let { parcel ->
        AlertDialog(
            onDismissRequest = { releaseTarget = null },
            containerColor = Color(0xFF1E1B4B),
            title = { Text("Release Locker", color = Color.White, fontWeight = FontWeight.Bold) },
            text  = {
                Text(
                    "Release locker ${parcel.lockerLabel} and mark parcel ${parcel.trackingId} as expired?",
                    color = Color.Gray
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        releaseTarget = null
                        scope.launch {
                            try {
                                val resp = ApiClient.apiService.releaseLocker(parcel.id)
                                if (resp.isSuccessful && resp.body()?.success == true) {
                                    Toast.makeText(context, "Locker released ✅", Toast.LENGTH_SHORT).show()
                                    loadParcels()
                                } else {
                                    Toast.makeText(context, resp.body()?.error ?: "Failed", Toast.LENGTH_SHORT).show()
                                }
                            } catch (e: Exception) {
                                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444))
                ) { Text("Release") }
            },
            dismissButton = {
                TextButton(onClick = { releaseTarget = null }) {
                    Text("Cancel", color = Color.Gray)
                }
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Manage Parcels", color = Color.White, fontWeight = FontWeight.Bold)
                        Text("${parcels.size} total parcels", color = Color.Gray, fontSize = 12.sp)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
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
        ) {
            // Status filter tabs
            PrimaryScrollableTabRow(
                selectedTabIndex = tabIndex,
                containerColor = Color(0xFF1E1B4B),
                contentColor = Color(0xFF818CF8),
                edgePadding = 8.dp
            ) {
                tabs.forEachIndexed { i, label ->
                    val count = when (i) {
                        0 -> parcels.size
                        1 -> parcels.count { it.status == "pending" }
                        2 -> parcels.count { it.status == "ready" }
                        3 -> parcels.count { it.status == "collected" }
                        4 -> parcels.count { it.status == "expired" }
                        else -> 0
                    }
                    Tab(
                        selected = tabIndex == i,
                        onClick = { tabIndex = i },
                        text = { Text("$label ($count)", fontSize = 13.sp) }
                    )
                }
            }

            if (isLoading) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Color(0xFF818CF8))
                }
            } else if (filtered.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("📭", fontSize = 48.sp)
                        Spacer(Modifier.height(12.dp))
                        Text("No parcels found", color = Color.Gray, fontSize = 16.sp)
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item { Spacer(Modifier.height(12.dp)) }

                    items(filtered, key = { it.id }) { parcel ->
                        AdminParcelCard(
                            parcel = parcel,
                            onRelease = { releaseTarget = parcel }
                        )
                    }

                    item { Spacer(Modifier.height(16.dp)) }
                }
            }
        }
    }
}

@Composable
private fun AdminParcelCard(parcel: Parcel, onRelease: () -> Unit) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B4B)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Top row: tracking ID + status chip
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    parcel.trackingId,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
                Surface(
                    shape = RoundedCornerShape(50.dp),
                    color = statusColor(parcel.status).copy(alpha = 0.2f)
                ) {
                    Text(
                        "${statusEmoji(parcel.status)} ${parcel.status.replaceFirstChar { it.uppercase() }}",
                        color = statusColor(parcel.status),
                        fontSize = 11.sp,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(Modifier.height(8.dp))

            // Student info
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF0F0A2A), RoundedCornerShape(8.dp))
                    .padding(10.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Student", color = Color.Gray, fontSize = 11.sp)
                    Text(parcel.studentName, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("Service", color = Color.Gray, fontSize = 11.sp)
                    Text(parcel.deliveryService, color = Color(0xFF818CF8), fontSize = 13.sp)
                }
            }

            Spacer(Modifier.height(8.dp))

            // Description
            Text(parcel.description, color = Color.Gray, fontSize = 13.sp)

            Spacer(Modifier.height(6.dp))
            Text("Arrived: ${parcel.arrivedAt.take(10)}", color = Color.Gray, fontSize = 11.sp)

            // Locker info + release button (for ready parcels)
            if (parcel.status == "ready" && parcel.lockerLabel != null) {
                Spacer(Modifier.height(12.dp))
                HorizontalDivider(color = Color.White.copy(alpha = 0.08f))
                Spacer(Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Locker", color = Color.Gray, fontSize = 11.sp)
                        Text(
                            parcel.lockerLabel,
                            color = Color(0xFF34D399),
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text("OTP", color = Color.Gray, fontSize = 11.sp)
                        Text(
                            parcel.otp ?: "------",
                            color = Color(0xFF818CF8),
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 22.sp,
                            letterSpacing = 4.sp
                        )
                    }
                }
                Spacer(Modifier.height(10.dp))
                OutlinedButton(
                    onClick = onRelease,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFEF4444))
                ) {
                    Icon(Icons.Default.LockOpen, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Release Locker", color = Color(0xFFEF4444), fontSize = 13.sp)
                }
            }
        }
    }
}
