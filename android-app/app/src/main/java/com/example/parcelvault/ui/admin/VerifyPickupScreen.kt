package com.example.parcelvault.ui.admin

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.parcelvault.api.ApiClient
import com.example.parcelvault.api.CollectParcelRequest
import com.example.parcelvault.api.Parcel
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VerifyPickupScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val scope   = rememberCoroutineScope()

    var readyParcels by remember { mutableStateOf<List<Parcel>>(emptyList()) }
    var isLoading    by remember { mutableStateOf(true) }

    // OTP entry dialog state
    var selectedParcel    by remember { mutableStateOf<Parcel?>(null) }
    var otpInput          by remember { mutableStateOf("") }
    var isVerifying       by remember { mutableStateOf(false) }

    // Success overlay state
    var verifiedStudent   by remember { mutableStateOf("") }
    var showSuccess       by remember { mutableStateOf(false) }

    fun loadReady() {
        scope.launch {
            isLoading = true
            try {
                val resp = ApiClient.apiService.getParcels()
                if (resp.isSuccessful && resp.body()?.success == true) {
                    readyParcels = resp.body()?.data?.filter { it.status == "ready" } ?: emptyList()
                }
            } catch (e: Exception) {
                Toast.makeText(context, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) { loadReady() }

    // ── OTP Entry Dialog ─────────────────────────────────────────────────────
    selectedParcel?.let { parcel ->
        AlertDialog(
            onDismissRequest = { if (!isVerifying) { selectedParcel = null; otpInput = "" } },
            containerColor   = Color(0xFF1E1B4B),
            title = {
                Column {
                    Text("Verify Student Identity", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Spacer(Modifier.height(4.dp))
                    Text("Ask the student to show their OTP", color = Color.Gray, fontSize = 13.sp)
                }
            },
            text = {
                Column {
                    // Student info banner
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                Brush.horizontalGradient(listOf(Color(0xFF1E3A5F), Color(0xFF312E81))),
                                RoundedCornerShape(12.dp)
                            )
                            .padding(14.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Initials avatar
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .background(Color(0xFF3B82F6), RoundedCornerShape(50.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    parcel.studentName.split(" ").take(2)
                                        .joinToString("") { it.firstOrNull()?.uppercase() ?: "" }
                                        .ifBlank { "S" },
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp
                                )
                            }
                            Column {
                                Text(parcel.studentName, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                Text("Locker ${parcel.lockerLabel ?: "?"} · ${parcel.trackingId}", color = Color.Gray, fontSize = 12.sp)
                            }
                        }
                    }

                    Spacer(Modifier.height(16.dp))

                    Text("Enter OTP shown by student:", color = Color.Gray, fontSize = 13.sp)
                    Spacer(Modifier.height(8.dp))

                    OutlinedTextField(
                        value = otpInput,
                        onValueChange = { if (it.length <= 6 && it.all { c -> c.isDigit() }) otpInput = it },
                        label = { Text("6-digit OTP", color = Color.Gray) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor    = Color.White,
                            unfocusedTextColor  = Color.White,
                            focusedBorderColor  = Color(0xFF818CF8),
                            unfocusedBorderColor= Color.Gray
                        ),
                        textStyle = androidx.compose.ui.text.TextStyle(
                            fontSize = 28.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = 8.sp,
                            textAlign = TextAlign.Center,
                            color = Color(0xFF818CF8)
                        )
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (otpInput.length != 6) {
                            Toast.makeText(context, "Enter the 6-digit OTP", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        isVerifying = true
                        scope.launch {
                            try {
                                val resp = ApiClient.apiService.collectParcel(
                                    parcel.id,
                                    CollectParcelRequest(otpInput)
                                )
                                if (resp.isSuccessful && resp.body()?.success == true) {
                                    val code = parcel.studentCode
                                    val locker = parcel.lockerLabel ?: "N/A"
                                    verifiedStudent = if (code.isNotBlank()) "${parcel.studentName} ($code) · Locker $locker" else "${parcel.studentName} · Locker $locker"
                                    selectedParcel = null
                                    otpInput = ""
                                    showSuccess = true
                                    loadReady()
                                } else {
                                    val errMsg = resp.body()?.error ?: "Verification failed"
                                    Toast.makeText(context, "❌ $errMsg", Toast.LENGTH_LONG).show()
                                }
                            } catch (e: Exception) {
                                Toast.makeText(context, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
                            } finally {
                                isVerifying = false
                            }
                        }
                    },
                    enabled = !isVerifying && otpInput.length == 6,
                    colors  = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                ) {
                    if (isVerifying) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White)
                    } else {
                        Text("Verify & Release", fontWeight = FontWeight.Bold)
                    }
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedParcel = null; otpInput = "" }) {
                    Text("Cancel", color = Color.Gray)
                }
            }
        )
    }

    // ── Success Overlay ──────────────────────────────────────────────────────
    if (showSuccess) {
        AlertDialog(
            onDismissRequest = { showSuccess = false },
            containerColor   = Color(0xFF064E3B),
            title = {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF34D399), modifier = Modifier.size(56.dp))
                    Spacer(Modifier.height(8.dp))
                    Text("Identity Verified ✅", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 20.sp, textAlign = TextAlign.Center)
                }
            },
            text = {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Text(verifiedStudent, color = Color(0xFF6EE7B7), fontWeight = FontWeight.Bold, fontSize = 18.sp, textAlign = TextAlign.Center)
                    Spacer(Modifier.height(6.dp))
                    Text("Parcel successfully released.\nLocker has been freed.", color = Color.Gray, fontSize = 14.sp, textAlign = TextAlign.Center)
                }
            },
            confirmButton = {
                Button(
                    onClick  = { showSuccess = false },
                    modifier = Modifier.fillMaxWidth(),
                    colors   = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                ) { Text("Done", fontWeight = FontWeight.Bold) }
            }
        )
    }

    // ── Main Screen ──────────────────────────────────────────────────────────
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Verify Student Pickup", color = Color.White, fontWeight = FontWeight.Bold)
                        Text("${readyParcels.size} parcel(s) awaiting collection", color = Color.Gray, fontSize = 12.sp)
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

        if (isLoading) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFF818CF8))
            }
        } else if (readyParcels.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("✅", fontSize = 56.sp)
                    Spacer(Modifier.height(12.dp))
                    Text("No parcels waiting", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
                    Text("All parcels have been collected", color = Color.Gray, fontSize = 14.sp, modifier = Modifier.padding(top = 4.dp))
                }
            }
        } else {
            var showScanDialog by remember { mutableStateOf(false) }
            var qrTokenInput   by remember { mutableStateOf("") }
            var isScanningQR   by remember { mutableStateOf(false) }

            val scanLauncher = androidx.activity.compose.rememberLauncherForActivityResult(
                contract = com.journeyapps.barcodescanner.ScanContract()
            ) { result ->
                if (result.contents != null) {
                    val scannedData = result.contents
                    qrTokenInput = scannedData
                    isScanningQR = true
                    scope.launch {
                        try {
                            val resp = ApiClient.apiService.verifyQR(
                                com.example.parcelvault.api.VerifyQRRequest(
                                    qrData = scannedData,
                                    autoConfirm = true
                                )
                            )
                            if (resp.isSuccessful && resp.body()?.success == true) {
                                val parcel = resp.body()?.data
                                val name = parcel?.studentName ?: "Student"
                                val code = parcel?.studentCode ?: ""
                                val locker = parcel?.lockerLabel ?: "N/A"
                                verifiedStudent = if (code.isNotBlank()) "$name ($code) · Locker $locker" else "$name · Locker $locker"
                                showScanDialog = false
                                qrTokenInput = ""
                                showSuccess = true
                                loadReady()
                                Toast.makeText(context, "Student Verified! Parcel released ✅", Toast.LENGTH_SHORT).show()
                            } else {
                                val errMsg = resp.body()?.error ?: "Invalid QR Code. Student NOT verified."
                                Toast.makeText(context, "❌ $errMsg", Toast.LENGTH_LONG).show()
                            }
                        } catch (e: Exception) {
                            Toast.makeText(context, "Verification error: ${e.message}", Toast.LENGTH_SHORT).show()
                        } finally {
                            isScanningQR = false
                        }
                    }
                }
            }

            // QR Scanner / Token Verification Dialog
            if (showScanDialog) {
                AlertDialog(
                    onDismissRequest = { if (!isScanningQR) showScanDialog = false },
                    containerColor   = Color(0xFF1E1B4B),
                    title = {
                        Text("📷 Live Camera QR Scanner", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    },
                    text = {
                        Column {
                            Button(
                                onClick = {
                                    val options = com.journeyapps.barcodescanner.ScanOptions().apply {
                                        setDesiredBarcodeFormats(com.journeyapps.barcodescanner.ScanOptions.QR_CODE)
                                        setPrompt("Scan Student QR Pass on phone screen")
                                        setCameraId(0)
                                        setBeepEnabled(true)
                                        setBarcodeImageEnabled(true)
                                    }
                                    scanLauncher.launch(options)
                                },
                                modifier = Modifier.fillMaxWidth().height(48.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1))
                            ) {
                                Text("📷 Launch Camera Scanner", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            }

                            Spacer(Modifier.height(14.dp))
                            HorizontalDivider(color = Color.White.copy(alpha = 0.1f))
                            Spacer(Modifier.height(14.dp))

                            Text("Or paste scanned QR code token manually:", color = Color.Gray, fontSize = 12.sp)
                            Spacer(Modifier.height(8.dp))

                            OutlinedTextField(
                                value = qrTokenInput,
                                onValueChange = { qrTokenInput = it },
                                label = { Text("Paste QR Code / Token", color = Color.Gray) },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.White,
                                    focusedBorderColor = Color(0xFF818CF8),
                                    unfocusedBorderColor = Color.Gray
                                )
                            )
                        }
                    },
                    confirmButton = {
                        Button(
                            onClick = {
                                val input = qrTokenInput.trim()
                                if (input.isBlank()) {
                                    Toast.makeText(context, "Please enter or scan a QR code", Toast.LENGTH_SHORT).show()
                                    return@Button
                                }
                                isScanningQR = true
                                scope.launch {
                                    try {
                                        val resp = ApiClient.apiService.verifyQR(
                                            com.example.parcelvault.api.VerifyQRRequest(
                                                qrData = input,
                                                autoConfirm = true
                                            )
                                        )
                                        if (resp.isSuccessful && resp.body()?.success == true) {
                                            val parcel = resp.body()?.data
                                            verifiedStudent = parcel?.studentName ?: "Student"
                                            showScanDialog = false
                                            qrTokenInput = ""
                                            showSuccess = true
                                            loadReady()
                                            Toast.makeText(context, "Student Verified! Parcel released ✅", Toast.LENGTH_LONG).show()
                                        } else {
                                            val errMsg = resp.body()?.error ?: "Invalid QR Code. Student NOT verified."
                                            Toast.makeText(context, "❌ $errMsg", Toast.LENGTH_LONG).show()
                                        }
                                    } catch (e: Exception) {
                                        Toast.makeText(context, "Verification error: ${e.message}", Toast.LENGTH_SHORT).show()
                                    } finally {
                                        isScanningQR = false
                                    }
                                }
                            },
                            enabled = !isScanningQR,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                        ) {
                            if (isScanningQR) {
                                CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White)
                            } else {
                                Text("Verify & Release", fontWeight = FontWeight.Bold)
                            }
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = { showScanDialog = false; qrTokenInput = "" }) {
                            Text("Cancel", color = Color.Gray)
                        }
                    }
                )
            }

            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    Spacer(Modifier.height(12.dp))
                    
                    // QR Scanner Action Card
                    Card(
                        onClick = {
                            val options = com.journeyapps.barcodescanner.ScanOptions().apply {
                                setDesiredBarcodeFormats(com.journeyapps.barcodescanner.ScanOptions.QR_CODE)
                                setPrompt("Point camera at Student QR Pass screen")
                                setCameraId(0)
                                setBeepEnabled(true)
                                setBarcodeImageEnabled(true)
                            }
                            scanLauncher.launch(options)
                        },
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF4C1D95)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(14.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .background(Color.White.copy(alpha = 0.2f), RoundedCornerShape(12.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("📷", fontSize = 24.sp)
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Scan Student QR Pass (Live Camera)", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                Text("Tap to open live camera and scan student QR code", color = Color(0xFFC4B5FD), fontSize = 12.sp)
                            }
                        }
                    }

                    Spacer(Modifier.height(10.dp))

                    // Instructions banner
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                Brush.horizontalGradient(listOf(Color(0xFF1E1B4B), Color(0xFF312E81))),
                                RoundedCornerShape(14.dp)
                            )
                            .padding(16.dp)
                    ) {
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text("🔐", fontSize = 32.sp)
                            Column {
                                Text("How to verify", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text(
                                    "Tap 'Scan Student QR Pass' or select a parcel below → enter OTP to verify & release parcel",
                                    color = Color.Gray, fontSize = 12.sp
                                )
                            }
                        }
                    }
                }

                items(readyParcels, key = { it.id }) { parcel ->
                    ReadyParcelCard(parcel = parcel, onVerifyClick = { selectedParcel = parcel })
                }

                item { Spacer(Modifier.height(16.dp)) }
            }
        }
    }
}

@Composable
private fun ReadyParcelCard(parcel: Parcel, onVerifyClick: () -> Unit) {
    val initials = parcel.studentName.split(" ").take(2)
        .joinToString("") { it.firstOrNull()?.uppercase() ?: "" }.ifBlank { "S" }

    Card(
        shape  = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B4B)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {

            // Student identity — most prominent element
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .background(
                            Brush.linearGradient(listOf(Color(0xFF3B82F6), Color(0xFF9333EA))),
                            RoundedCornerShape(50.dp)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(initials, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 20.sp)
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        parcel.studentName,
                        color = Color.White,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 20.sp
                    )
                    Text("Student ID: ${parcel.studentCode}", color = Color(0xFF60A5FA), fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    Text(parcel.trackingId, color = Color.Gray, fontSize = 12.sp)
                    Text(parcel.description, color = Color.Gray, fontSize = 12.sp)
                }
                // Locker badge
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("🗄️", fontSize = 20.sp)
                    Text(
                        parcel.lockerLabel ?: "?",
                        color = Color(0xFF34D399),
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 22.sp
                    )
                }
            }

            Spacer(Modifier.height(14.dp))
            HorizontalDivider(color = Color.White.copy(alpha = 0.08f))
            Spacer(Modifier.height(12.dp))

            Button(
                onClick  = onVerifyClick,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape    = RoundedCornerShape(12.dp),
                colors   = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
            ) {
                Icon(Icons.Default.Person, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text("Verify Student & Release Parcel", fontWeight = FontWeight.Bold)
            }
        }
    }
}
