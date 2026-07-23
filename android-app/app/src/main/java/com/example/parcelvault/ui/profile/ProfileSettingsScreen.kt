package com.example.parcelvault.ui.profile

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.parcelvault.api.ApiClient
import com.example.parcelvault.api.ChangePasswordRequest
import com.example.parcelvault.api.UpdateProfileRequest
import com.example.parcelvault.api.SubmitFeedbackRequest
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.Language
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileSettingsScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val scope   = rememberCoroutineScope()

    // ── Edit Profile Dialog ─────────────────────────────────────────────────────
    var showProfileDialog by remember { mutableStateOf(false) }
    var nameInput        by remember { mutableStateOf(ApiClient.userName ?: "") }
    var phoneInput       by remember { mutableStateOf(ApiClient.userPhone ?: "") }
    var studentIdInput   by remember { mutableStateOf(ApiClient.userStudentId ?: "") }
    var isSavingProfile  by remember { mutableStateOf(false) }

    // ── Feedback Dialog ──────────────────────────────────────────────────────
    var showFeedbackDialog by remember { mutableStateOf(false) }
    var feedbackSubject by remember { mutableStateOf("") }
    var feedbackMessage by remember { mutableStateOf("") }
    var isSubmittingFeedback by remember { mutableStateOf(false) }

    if (showFeedbackDialog) {
        AlertDialog(
            onDismissRequest = { if (!isSubmittingFeedback) showFeedbackDialog = false },
            containerColor   = Color(0xFF1E1B4B),
            title = { Text("💬 Send Feedback to Admin", color = Color.White, fontWeight = FontWeight.Bold) },
            text  = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Your feedback will be sent directly to the campus admin with your registered name: ${ApiClient.userName ?: "Student"}", color = Color.Gray, fontSize = 12.sp)
                    OutlinedTextField(
                        value       = feedbackSubject,
                        onValueChange = { feedbackSubject = it },
                        label       = { Text("Subject (Optional)", color = Color.Gray) },
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
                        value       = feedbackMessage,
                        onValueChange = { feedbackMessage = it },
                        label       = { Text("Feedback Message *", color = Color.Gray) },
                        modifier    = Modifier.fillMaxWidth().height(120.dp),
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
                        if (feedbackMessage.trim().isBlank()) {
                            Toast.makeText(context, "Please enter a feedback message", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        isSubmittingFeedback = true
                        scope.launch {
                            try {
                                val resp = ApiClient.apiService.submitFeedback(
                                    SubmitFeedbackRequest(
                                        subject = feedbackSubject.trim(),
                                        message = feedbackMessage.trim(),
                                        name    = ApiClient.userName,
                                        email   = ApiClient.userEmail
                                    )
                                )
                                if (resp.isSuccessful && resp.body()?.success == true) {
                                    Toast.makeText(context, "Feedback sent to admin! Thank you. ✅", Toast.LENGTH_LONG).show()
                                    showFeedbackDialog = false
                                    feedbackSubject = ""
                                    feedbackMessage = ""
                                } else {
                                    Toast.makeText(context, resp.body()?.error ?: "Failed to submit feedback", Toast.LENGTH_SHORT).show()
                                }
                            } catch (e: Exception) {
                                Toast.makeText(context, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
                            } finally {
                                isSubmittingFeedback = false
                            }
                        }
                    },
                    enabled = !isSubmittingFeedback,
                    colors  = ButtonDefaults.buttonColors(containerColor = Color(0xFFEC4899))
                ) {
                    if (isSubmittingFeedback) CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White)
                    else Text("Submit Feedback")
                }
            },
            dismissButton = {
                TextButton(onClick = { showFeedbackDialog = false }) { Text("Cancel", color = Color.Gray) }
            }
        )
    }

    // ── Preferences Toggles ───────────────────────────────────────────────────
    var pushNotificationsEnabled by remember { mutableStateOf(true) }
    var emailAlertsEnabled by remember { mutableStateOf(true) }

    // ── Change Password Dialog ────────────────────────────────────────────────
    var showPwDialog     by remember { mutableStateOf(false) }
    var currentPw        by remember { mutableStateOf("") }
    var newPw            by remember { mutableStateOf("") }
    var confirmPw        by remember { mutableStateOf("") }
    var isSavingPw       by remember { mutableStateOf(false) }

    // ── Server IP Dialog ──────────────────────────────────────────────────────
    var showServerDialog by remember { mutableStateOf(false) }
    var serverIpInput    by remember { mutableStateOf(ApiClient.currentBaseUrl) }

    val displayName  = ApiClient.userName  ?: "User"
    val displayEmail = ApiClient.userEmail ?: ""
    val isAdmin      = ApiClient.userRole  == "admin"
    val initials     = displayName.split(" ").take(2)
        .joinToString("") { it.firstOrNull()?.uppercase() ?: "" }.ifBlank { "U" }

    // ── Edit Profile Dialog ──────────────────────────────────────────────────────────
    if (showProfileDialog) {
        AlertDialog(
            onDismissRequest = { if (!isSavingProfile) showProfileDialog = false },
            containerColor   = Color(0xFF1E1B4B),
            title = { Text("Edit Profile", color = Color.White, fontWeight = FontWeight.Bold) },
            text  = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value       = nameInput,
                        onValueChange = { nameInput = it },
                        label       = { Text("Full Name", color = Color.Gray) },
                        singleLine  = true,
                        modifier    = Modifier.fillMaxWidth(),
                        shape       = RoundedCornerShape(12.dp),
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor    = Color.White,
                            unfocusedTextColor  = Color.White,
                            focusedBorderColor  = Color(0xFF818CF8),
                            unfocusedBorderColor= Color.Gray
                        )
                    )
                    OutlinedTextField(
                        value       = phoneInput,
                        onValueChange = { phoneInput = it },
                        label       = { Text("Phone Number", color = Color.Gray) },
                        singleLine  = true,
                        modifier    = Modifier.fillMaxWidth(),
                        shape       = RoundedCornerShape(12.dp),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone, imeAction = ImeAction.Next),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor    = Color.White,
                            unfocusedTextColor  = Color.White,
                            focusedBorderColor  = Color(0xFF818CF8),
                            unfocusedBorderColor= Color.Gray
                        )
                    )
                    OutlinedTextField(
                        value       = studentIdInput,
                        onValueChange = { studentIdInput = it },
                        label       = { Text("Student ID", color = Color.Gray) },
                        singleLine  = true,
                        modifier    = Modifier.fillMaxWidth(),
                        shape       = RoundedCornerShape(12.dp),
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
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
                        if (nameInput.trim().length < 2) {
                            Toast.makeText(context, "Name must be at least 2 characters", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        isSavingProfile = true
                        scope.launch {
                            try {
                                val resp = ApiClient.apiService.updateProfile(UpdateProfileRequest(nameInput.trim(), phoneInput.trim(), studentIdInput.trim()))
                                if (resp.isSuccessful && resp.body()?.success == true) {
                                    val updatedName = resp.body()?.name ?: nameInput.trim()
                                    ApiClient.saveSession(
                                        context,
                                        ApiClient.token ?: "",
                                        ApiClient.userId,
                                        updatedName,
                                        ApiClient.userEmail,
                                        phoneInput.trim(),
                                        studentIdInput.trim(),
                                        ApiClient.userRole
                                    )
                                    Toast.makeText(context, "Profile updated ✅", Toast.LENGTH_SHORT).show()
                                    showProfileDialog = false
                                } else {
                                    val errMsg = try {
                                        val json = resp.errorBody()?.string()
                                        val map: Map<String, Any> = Gson().fromJson(json, object : TypeToken<Map<String, Any>>() {}.type)
                                        map["error"] as? String ?: "Update failed"
                                    } catch (e: Exception) { "Update failed" }
                                    Toast.makeText(context, errMsg, Toast.LENGTH_SHORT).show()
                                }
                            } catch (e: Exception) {
                                Toast.makeText(context, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
                            } finally {
                                isSavingProfile = false
                            }
                        }
                    },
                    enabled = !isSavingProfile,
                    colors  = ButtonDefaults.buttonColors(containerColor = Color(0xFF818CF8))
                ) {
                    if (isSavingProfile) CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White)
                    else Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { showProfileDialog = false }) { Text("Cancel", color = Color.Gray) }
            }
        )
    }

    // ── Password Dialog ──────────────────────────────────────────────────────
    if (showPwDialog) {
        AlertDialog(
            onDismissRequest = { if (!isSavingPw) { showPwDialog = false; currentPw = ""; newPw = ""; confirmPw = "" } },
            containerColor   = Color(0xFF1E1B4B),
            title = { Text("Change Password", color = Color.White, fontWeight = FontWeight.Bold) },
            text  = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value         = currentPw,
                        onValueChange = { currentPw = it },
                        label         = { Text("Current Password", color = Color.Gray) },
                        singleLine    = true,
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Next),
                        modifier      = Modifier.fillMaxWidth(),
                        shape         = RoundedCornerShape(12.dp),
                        colors        = OutlinedTextFieldDefaults.colors(
                            focusedTextColor    = Color.White,
                            unfocusedTextColor  = Color.White,
                            focusedBorderColor  = Color(0xFF818CF8),
                            unfocusedBorderColor= Color.Gray
                        )
                    )
                    OutlinedTextField(
                        value         = newPw,
                        onValueChange = { newPw = it },
                        label         = { Text("New Password", color = Color.Gray) },
                        singleLine    = true,
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Next),
                        modifier      = Modifier.fillMaxWidth(),
                        shape         = RoundedCornerShape(12.dp),
                        colors        = OutlinedTextFieldDefaults.colors(
                            focusedTextColor    = Color.White,
                            unfocusedTextColor  = Color.White,
                            focusedBorderColor  = Color(0xFF818CF8),
                            unfocusedBorderColor= Color.Gray
                        )
                    )
                    OutlinedTextField(
                        value         = confirmPw,
                        onValueChange = { confirmPw = it },
                        label         = { Text("Confirm New Password", color = Color.Gray) },
                        singleLine    = true,
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
                        modifier      = Modifier.fillMaxWidth(),
                        shape         = RoundedCornerShape(12.dp),
                        colors        = OutlinedTextFieldDefaults.colors(
                            focusedTextColor    = Color.White,
                            unfocusedTextColor  = Color.White,
                            focusedBorderColor  = Color(0xFF818CF8),
                            unfocusedBorderColor= Color.Gray
                        )
                    )
                    if (newPw.isNotBlank() && confirmPw.isNotBlank() && newPw != confirmPw) {
                        Text("Passwords don't match", color = Color(0xFFEF4444), fontSize = 12.sp)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        when {
                            currentPw.isBlank() || newPw.isBlank() || confirmPw.isBlank() ->
                                Toast.makeText(context, "Please fill all fields", Toast.LENGTH_SHORT).show()
                            newPw != confirmPw ->
                                Toast.makeText(context, "New passwords don't match", Toast.LENGTH_SHORT).show()
                            else -> {
                                isSavingPw = true
                                scope.launch {
                                    try {
                                        val resp = ApiClient.apiService.changePassword(
                                            ChangePasswordRequest(currentPw, newPw)
                                        )
                                        if (resp.isSuccessful && resp.body()?.success == true) {
                                            Toast.makeText(context, "Password changed ✅", Toast.LENGTH_SHORT).show()
                                            showPwDialog = false
                                            currentPw = ""; newPw = ""; confirmPw = ""
                                        } else {
                                            val errMsg = try {
                                                val json = resp.errorBody()?.string()
                                                val map: Map<String, Any> = Gson().fromJson(json, object : TypeToken<Map<String, Any>>() {}.type)
                                                map["error"] as? String ?: resp.body()?.error ?: "Change failed"
                                            } catch (e: Exception) { resp.body()?.error ?: "Change failed" }
                                            Toast.makeText(context, errMsg, Toast.LENGTH_LONG).show()
                                        }
                                    } catch (e: Exception) {
                                        Toast.makeText(context, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
                                    } finally {
                                        isSavingPw = false
                                    }
                                }
                            }
                        }
                    },
                    enabled = !isSavingPw,
                    colors  = ButtonDefaults.buttonColors(containerColor = Color(0xFF818CF8))
                ) {
                    if (isSavingPw) CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White)
                    else Text("Change Password")
                }
            },
            dismissButton = {
                TextButton(onClick = { showPwDialog = false; currentPw = ""; newPw = ""; confirmPw = "" }) {
                    Text("Cancel", color = Color.Gray)
                }
            }
        )
    }

    // ── Server IP Dialog ──────────────────────────────────────────────────────
    if (showServerDialog) {
        AlertDialog(
            onDismissRequest = { showServerDialog = false },
            containerColor   = Color(0xFF1E1B4B),
            title = { Text("🌐 Server Connection URL", color = Color.White, fontWeight = FontWeight.Bold) },
            text  = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Enter your PC's local Wi-Fi IP address:", color = Color.Gray, fontSize = 13.sp)
                    OutlinedTextField(
                        value       = serverIpInput,
                        onValueChange = { serverIpInput = it },
                        label       = { Text("Base URL", color = Color.Gray) },
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
                    Text("Quick Presets (Tap to fill):", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.LightGray)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        AssistChip(
                            onClick = { serverIpInput = "http://172.16.251.223:3001/api/" },
                            label   = { Text("🌐 172.16.251.223 (PC)", fontSize = 11.sp) }
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        AssistChip(
                            onClick = { serverIpInput = "http://10.0.2.2:3001/api/" },
                            label   = { Text("📱 Emulator (10.0.2.2)", fontSize = 11.sp) }
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        ApiClient.updateBaseUrl(context, serverIpInput)
                        Toast.makeText(context, "✅ Server URL updated to: ${ApiClient.currentBaseUrl}", Toast.LENGTH_LONG).show()
                        showServerDialog = false
                    },
                    colors  = ButtonDefaults.buttonColors(containerColor = Color(0xFF818CF8))
                ) {
                    Text("Save & Apply")
                }
            },
            dismissButton = {
                TextButton(onClick = { showServerDialog = false }) { Text("Cancel", color = Color.Gray) }
            }
        )
    }


    // ── Main Screen ──────────────────────────────────────────────────────────
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Profile & Settings", color = Color.White, fontWeight = FontWeight.Bold) },
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
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(32.dp))

            // Avatar
            Box(
                modifier = Modifier
                    .size(88.dp)
                    .background(
                        Brush.linearGradient(listOf(Color(0xFF3B82F6), Color(0xFF9333EA))),
                        RoundedCornerShape(50.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(initials, color = Color.White, fontSize = 32.sp, fontWeight = FontWeight.Bold)
            }

            Spacer(Modifier.height(16.dp))
            Text(displayName, color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(4.dp))
            Text(displayEmail, color = Color.Gray, fontSize = 14.sp)
            Spacer(Modifier.height(8.dp))

            Surface(
                shape = RoundedCornerShape(50.dp),
                color = if (isAdmin) Color(0xFFDC2626).copy(alpha = 0.2f) else Color(0xFF3B82F6).copy(alpha = 0.2f)
            ) {
                Text(
                    if (isAdmin) "🛡️ Administrator" else "🎓 Student",
                    color = if (isAdmin) Color(0xFFFCA5A5) else Color(0xFF60A5FA),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 5.dp)
                )
            }

            Spacer(Modifier.height(32.dp))

            // ── Account Settings Section ─────────────────────────────────────
            SectionHeader("Account Settings")
            Spacer(Modifier.height(10.dp))

            SettingsRow(
                icon     = Icons.Default.Person,
                title    = "Edit Profile",
                subtitle = "Name, Phone & ID",
                iconColor= Color(0xFF818CF8),
                onClick  = { 
                    nameInput = ApiClient.userName ?: ""
                    phoneInput = ApiClient.userPhone ?: ""
                    studentIdInput = ApiClient.userStudentId ?: ""
                    showProfileDialog = true 
                }
            )
            Spacer(Modifier.height(10.dp))
            SettingsRow(
                icon     = Icons.Default.Lock,
                title    = "Change Password",
                subtitle = "Update your login password",
                iconColor= Color(0xFFF59E0B),
                onClick  = { showPwDialog = true }
            )
            Spacer(Modifier.height(10.dp))
            SettingsRow(
                icon     = Icons.Default.Settings,
                title    = "Server Connection URL",
                subtitle = ApiClient.currentBaseUrl,
                iconColor= Color(0xFF10B981),
                onClick  = { serverIpInput = ApiClient.currentBaseUrl; showServerDialog = true }
            )

            Spacer(Modifier.height(24.dp))
            SectionHeader("Preferences")
            Spacer(Modifier.height(10.dp))
            
            ToggleRow("Push Notifications", Icons.Default.Notifications, Color(0xFFF59E0B), pushNotificationsEnabled) { pushNotificationsEnabled = it }
            Spacer(Modifier.height(10.dp))
            ToggleRow("Email Alerts", Icons.Default.Email, Color(0xFF10B981), emailAlertsEnabled) { emailAlertsEnabled = it }
            Spacer(Modifier.height(10.dp))
            SettingsRow(
                icon     = Icons.Default.Palette,
                title    = "Theme",
                subtitle = "Dark Mode",
                iconColor= Color(0xFF8B5CF6),
                onClick  = { Toast.makeText(context, "Only Dark Theme is available right now.", Toast.LENGTH_SHORT).show() }
            )
            Spacer(Modifier.height(10.dp))
            SettingsRow(
                icon     = Icons.Default.Language,
                title    = "Language",
                subtitle = "English",
                iconColor= Color(0xFF3B82F6),
                onClick  = { Toast.makeText(context, "Language settings coming soon.", Toast.LENGTH_SHORT).show() }
            )
            
            Spacer(Modifier.height(24.dp))
            SectionHeader("Support")
            Spacer(Modifier.height(10.dp))
            
            SettingsRow(
                icon     = Icons.Default.Star,
                title    = "Send Feedback",
                subtitle = "Report issues or suggest features",
                iconColor= Color(0xFFEC4899),
                onClick  = { showFeedbackDialog = true }
            )

            Spacer(Modifier.height(24.dp))

            // ── Account Info Section ─────────────────────────────────────────
            SectionHeader("Account Info")
            Spacer(Modifier.height(10.dp))

            InfoRow("Email Address", displayEmail)
            Spacer(Modifier.height(10.dp))
            InfoRow("Role", if (isAdmin) "Administrator" else "Student")
            Spacer(Modifier.height(10.dp))
            InfoRow("App Version", "ParcelVault v1.0")

            Spacer(Modifier.height(40.dp))
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Row(modifier = Modifier.fillMaxWidth()) {
        Text(title, color = Color(0xFF818CF8), fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
    }
}

@Composable
private fun SettingsRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    iconColor: Color,
    onClick: () -> Unit
) {
    Card(
        shape   = RoundedCornerShape(14.dp),
        colors  = CardDefaults.cardColors(containerColor = Color(0xFF1E1B4B)),
        modifier= Modifier.fillMaxWidth(),
        onClick = onClick
    ) {
        Row(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(iconColor.copy(alpha = 0.2f), RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(20.dp))
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(title,    color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                Text(subtitle, color = Color.Gray,  fontSize = 12.sp)
            }
            Icon(Icons.Default.Edit, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(16.dp))
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Card(
        shape  = RoundedCornerShape(14.dp),
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

@Composable
private fun ToggleRow(
    title: String,
    icon: ImageVector,
    iconColor: Color,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Card(
        shape   = RoundedCornerShape(14.dp),
        colors  = CardDefaults.cardColors(containerColor = Color(0xFF1E1B4B)),
        modifier= Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(iconColor.copy(alpha = 0.2f), RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(20.dp))
            }
            Text(title, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, modifier = Modifier.weight(1f))
            Switch(
                checked = checked,
                onCheckedChange = onCheckedChange,
                colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = Color(0xFF818CF8))
            )
        }
    }
}
