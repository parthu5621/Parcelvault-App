package com.example.parcelvault.ui.admin

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.parcelvault.api.ApiClient
import com.example.parcelvault.api.AssignLockerRequest
import kotlinx.coroutines.launch

private data class PendingParcel(val id: String, val trackingId: String, val studentName: String, val studentCode: String, val description: String)
private data class AvailableLocker(val id: String, val label: String, val section: String, val size: String)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AssignLockerScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var pendingParcels by remember { mutableStateOf<List<PendingParcel>>(emptyList()) }
    var availableLockers by remember { mutableStateOf<List<AvailableLocker>>(emptyList()) }
    var selectedParcel by remember { mutableStateOf<PendingParcel?>(null) }
    var selectedLocker by remember { mutableStateOf<AvailableLocker?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var isSubmitting by remember { mutableStateOf(false) }

    // Success dialog
    var assignedOtp        by remember { mutableStateOf("") }
    var assignedStudentName by remember { mutableStateOf("") }
    var assignedLocker     by remember { mutableStateOf("") }
    var showSuccessDialog  by remember { mutableStateOf(false) }

    fun reload() {
        scope.launch {
            isLoading = true
            try {
                val pResponse = ApiClient.apiService.getParcels()
                if (pResponse.isSuccessful && pResponse.body()?.success == true) {
                    pendingParcels = pResponse.body()?.data
                        ?.filter { it.status == "pending" }
                        ?.map { PendingParcel(it.id, it.trackingId, it.studentName, it.studentCode, it.description) }
                        ?: emptyList()
                }
                val lResponse = ApiClient.apiService.getAvailableLockers()
                if (lResponse.isSuccessful && lResponse.body()?.success == true) {
                    availableLockers = lResponse.body()?.data?.map {
                        AvailableLocker(it.id, it.label, it.section, it.size)
                    } ?: emptyList()
                }
            } catch (e: Exception) {
                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) { reload() }

    // ── OTP Success Dialog ────────────────────────────────────────────────────
    if (showSuccessDialog) {
        AlertDialog(
            onDismissRequest = {},
            containerColor   = Color(0xFF064E3B),
            title = {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Text("✅", fontSize = 40.sp)
                    Spacer(Modifier.height(8.dp))
                    Text("Locker Assigned!", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 20.sp)
                }
            },
            text = {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        assignedStudentName,
                        color = Color(0xFF6EE7B7),
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 18.sp
                    )
                    Text("will receive their OTP notification", color = Color.Gray, fontSize = 13.sp)
                    Spacer(Modifier.height(16.dp))
                    Text("Locker", color = Color.Gray, fontSize = 12.sp)
                    Text(assignedLocker, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 22.sp)
                    Spacer(Modifier.height(8.dp))
                    Text("OTP Code", color = Color.Gray, fontSize = 12.sp)
                    Text(
                        assignedOtp,
                        color = Color(0xFF34D399),
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 40.sp,
                        letterSpacing = 6.sp
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "The student will see this OTP\nin their notifications.",
                        color = Color.Gray,
                        fontSize = 12.sp,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = { showSuccessDialog = false; onBack() },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                ) { Text("Done", fontWeight = FontWeight.Bold) }
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Assign Locker", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1E1B4B))
            )
        },
        containerColor = Color(0xFF0F0A2A),
        bottomBar = {
            if (selectedParcel != null && selectedLocker != null) {
                Box(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
                    Button(
                        onClick = {
                            isSubmitting = true
                            scope.launch {
                                try {
                                    val response = ApiClient.apiService.assignLocker(
                                        selectedParcel!!.id,
                                        AssignLockerRequest(selectedLocker!!.id)
                                    )
                                    if (response.isSuccessful && response.body()?.success == true) {
                                        assignedOtp = response.body()?.otp ?: "------"
                                        assignedStudentName = selectedParcel!!.studentName
                                        assignedLocker = selectedLocker!!.label
                                        selectedParcel = null
                                        selectedLocker = null
                                        showSuccessDialog = true
                                        reload()
                                    } else {
                                        Toast.makeText(context, response.body()?.error ?: "Assignment failed", Toast.LENGTH_SHORT).show()
                                    }
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                                } finally {
                                    isSubmitting = false
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth().height(54.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                        enabled = !isSubmitting
                    ) {
                        if (isSubmitting) {
                            CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
                        } else {
                            Icon(Icons.Default.Check, contentDescription = null, tint = Color.White)
                            Spacer(Modifier.width(8.dp))
                            Text(
                                "Assign Locker ${selectedLocker!!.label} to ${selectedParcel!!.studentName}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
            }
        }
    ) { padding ->
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFF818CF8))
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item { Spacer(Modifier.height(8.dp)) }

                // Step 1: Select Parcel
                item {
                    StepHeader("Step 1", "Select Student's Parcel", Color(0xFF3B82F6))
                }

                if (pendingParcels.isEmpty()) {
                    item {
                        Card(
                            shape  = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B4B)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Box(Modifier.padding(24.dp).fillMaxWidth(), contentAlignment = Alignment.Center) {
                                Text("No pending parcels", color = Color.Gray, fontSize = 14.sp)
                            }
                        }
                    }
                }

                items(pendingParcels) { parcel ->
                    val selected = selectedParcel?.id == parcel.id
                    val initials = parcel.studentName.split(" ").take(2)
                        .joinToString("") { it.firstOrNull()?.uppercase() ?: "" }.ifBlank { "S" }

                    Card(
                        shape  = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (selected) Color(0xFF1E3A5F) else Color(0xFF1E1B4B)
                        ),
                        border   = if (selected) CardDefaults.outlinedCardBorder() else null,
                        modifier = Modifier.fillMaxWidth(),
                        onClick  = { selectedParcel = if (selected) null else parcel }
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Student initials avatar
                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .background(
                                        if (selected) Color(0xFF3B82F6) else Color(0xFF374151),
                                        RoundedCornerShape(50.dp)
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(initials, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                // Student name — most prominent
                                Text(
                                    parcel.studentName,
                                    color = Color.White,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 18.sp
                                )
                                Text("Student ID: ${parcel.studentCode}", color = Color(0xFF60A5FA), fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                Text(parcel.trackingId, color = Color.Gray, fontSize = 12.sp)
                                Text(parcel.description, color = Color.Gray, fontSize = 12.sp)
                            }
                            if (selected) Icon(Icons.Default.Check, contentDescription = null, tint = Color(0xFF3B82F6))
                        }
                    }
                }

                item { Spacer(Modifier.height(4.dp)) }

                // Step 2: Select Locker
                item {
                    StepHeader("Step 2", "Select Available Locker", Color(0xFF10B981))
                }
                items(availableLockers) { locker ->
                    val selected = selectedLocker?.id == locker.id
                    Card(
                        shape  = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (selected) Color(0xFF064E3B) else Color(0xFF1E1B4B)
                        ),
                        modifier = Modifier.fillMaxWidth(),
                        onClick  = { selectedLocker = if (selected) null else locker }
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Text("🗄️", fontSize = 24.sp)
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Locker ${locker.label}", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text("Section ${locker.section} · ${locker.size}", color = Color(0xFF34D399), fontSize = 12.sp)
                            }
                            if (selected) Icon(Icons.Default.Check, contentDescription = null, tint = Color(0xFF10B981))
                        }
                    }
                }

                item { Spacer(Modifier.height(80.dp)) }
            }
        }
    }
}


@Composable
private fun StepHeader(step: String, title: String, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Box(
            modifier = Modifier
                .background(color.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                .padding(horizontal = 10.dp, vertical = 4.dp)
        ) {
            Text(step, color = color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
        Text(title, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
    }
}
