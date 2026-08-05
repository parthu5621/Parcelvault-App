package com.example.parcelvault.ui.login

import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.parcelvault.api.ApiClient
import com.example.parcelvault.api.LoginRequest
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.launch

data class SavedAndroidAccount(
    val email: String,
    val password: String = "",
    val role: String = "student",
    val name: String = ""
)

private const val PREFS_NAME = "parcelvault_prefs"
private const val PREFS_SAVED_ACCOUNTS = "parcelvault_saved_accounts_json"

private fun getSavedAccounts(context: Context): List<SavedAndroidAccount> {
    return try {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val json = prefs.getString(PREFS_SAVED_ACCOUNTS, null)
        if (!json.isNullOrBlank()) {
            val type = object : TypeToken<List<SavedAndroidAccount>>() {}.type
            Gson().fromJson<List<SavedAndroidAccount>>(json, type) ?: getDefaultDemoAccounts()
        } else {
            // Default demo accounts for quick convenience if none saved
            getDefaultDemoAccounts()
        }
    } catch (e: Exception) {
        getDefaultDemoAccounts()
    }
}

private fun getDefaultDemoAccounts(): List<SavedAndroidAccount> = emptyList()

private fun saveAccount(context: Context, account: SavedAndroidAccount) {
    try {
        val current = getSavedAccounts(context).filter { !it.email.equals(account.email, ignoreCase = true) }.toMutableList()
        current.add(0, account)
        val trimmed = current.take(5)
        val json = Gson().toJson(trimmed)
        context.getSharedPreferences("parcelvault_prefs", Context.MODE_PRIVATE)
            .edit()
            .putString(PREFS_SAVED_ACCOUNTS, json)
            .apply()
    } catch (e: Exception) {
        e.printStackTrace()
    }
}

private fun removeSavedAccount(context: Context, email: String): List<SavedAndroidAccount> {
    return try {
        val current = getSavedAccounts(context).filter { !it.email.equals(email, ignoreCase = true) }
        val json = Gson().toJson(current)
        context.getSharedPreferences("parcelvault_prefs", Context.MODE_PRIVATE)
            .edit()
            .putString(PREFS_SAVED_ACCOUNTS, json)
            .apply()
        current
    } catch (e: Exception) {
        emptyList()
    }
}

@Composable
fun LoginScreen(
    onLoginSuccess: (String, String) -> Unit,
    isAdmin: Boolean = false,
    onForgotPassword: () -> Unit = {},
    onSignUpClick: () -> Unit = {},
    onLoginWithOtp: () -> Unit = {}
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var role by remember { mutableStateOf(if (isAdmin) "admin" else "student") }
    var isLoading by remember { mutableStateOf(false) }

    var currentServerUrl by remember { mutableStateOf(ApiClient.currentBaseUrl) }
    var showServerDialog by remember { mutableStateOf(false) }
    var serverIpInput by remember { mutableStateOf("") }
    var showNetworkErrorDialog by remember { mutableStateOf(false) }
    var lastNetworkErrorMessage by remember { mutableStateOf("") }

    var showSaveAccountDialog by remember { mutableStateOf(false) }
    var pendingToken by remember { mutableStateOf("") }
    var pendingRole by remember { mutableStateOf("") }
    var pendingUserName by remember { mutableStateOf("") }

    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    var savedAccountsList by remember { mutableStateOf(emptyList<SavedAndroidAccount>()) }

    LaunchedEffect(Unit) {
        // Load saved accounts from SharedPreferences for quick login
        savedAccountsList = getSavedAccounts(context)
    }

    // ── Save Account Prompt Dialog ────────────────────────────────────────────────
    if (showSaveAccountDialog) {
        AlertDialog(
            onDismissRequest = {
                showSaveAccountDialog = false
                onLoginSuccess(pendingToken, pendingRole)
            },
            containerColor = Color(0xFF1E1B4B),
            title = {
                Text("Save Login Account?", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            },
            text = {
                Text(
                    "Would you like to save your account ($email) on this device for faster one-tap login next time?",
                    color = Color.LightGray,
                    fontSize = 14.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        saveAccount(
                            context,
                            SavedAndroidAccount(
                                email = email,
                                password = password,
                                role = pendingRole,
                                name = pendingUserName
                            )
                        )
                        showSaveAccountDialog = false
                        Toast.makeText(context, "Account saved for fast login!", Toast.LENGTH_SHORT).show()
                        onLoginSuccess(pendingToken, pendingRole)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF9333EA))
                ) {
                    Text("Yes, Save Account", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        showSaveAccountDialog = false
                        onLoginSuccess(pendingToken, pendingRole)
                    }
                ) {
                    Text("Not Now", color = Color.Gray)
                }
            }
        )
    }

    // Rich vibrant gradient background
    val gradientBrush = Brush.verticalGradient(
        colors = listOf(
            Color(0xFF0F0A2A),
            Color(0xFF1E1B4B),
            Color(0xFF312E81)
        )
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(gradientBrush)
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth()
        ) {
            // 🌐 Server Connection status chip
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = Color(0x22FFFFFF),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x44818CF8)),
                modifier = Modifier
                    .padding(bottom = 14.dp)
                    .clickable {
                        serverIpInput = currentServerUrl
                        showServerDialog = true
                    }
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                ) {
                    Text("🌐 Server IP: ", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Text(
                        text = currentServerUrl.removePrefix("http://").removeSuffix("/api/"),
                        color = Color(0xFF6EE7B7),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("✏️ Edit", color = Color(0xFFFDE047), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }

            Card(
                shape = RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B4B)),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF3730A3)),
                elevation = CardDefaults.cardElevation(defaultElevation = 16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Header Brand
                    Surface(
                        shape = CircleShape,
                        color = Color(0xFF6366F1).copy(alpha = 0.2f),
                        modifier = Modifier.size(56.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text("📦", fontSize = 28.sp)
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = "ParcelVault Access",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    
                    Text(
                        text = "Sign in to manage your campus parcels",
                        fontSize = 12.sp,
                        color = Color.LightGray,
                        modifier = Modifier.padding(bottom = 16.dp)
                    )

                    // ── Segmented Role Toggle (Student vs Admin) ──
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = Color(0xFF0F0A2A),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF312E81)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(4.dp)
                        ) {
                            // Student Segment
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = if (role == "student") Color(0xFF6366F1) else Color.Transparent,
                                modifier = Modifier
                                    .weight(1f)
                                    .clickable { role = "student" }
                            ) {
                                Box(
                                    contentAlignment = Alignment.Center,
                                    modifier = Modifier.padding(vertical = 10.dp)
                                ) {
                                    Text(
                                        text = "🎓 Student",
                                        color = if (role == "student") Color.White else Color.Gray,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp
                                    )
                                }
                            }

                            // Admin Segment
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = if (role == "admin") Color(0xFFA855F7) else Color.Transparent,
                                modifier = Modifier
                                    .weight(1f)
                                    .clickable { role = "admin" }
                            ) {
                                Box(
                                    contentAlignment = Alignment.Center,
                                    modifier = Modifier.padding(vertical = 10.dp)
                                ) {
                                    Text(
                                        text = "🛡️ Admin",
                                        color = if (role == "admin") Color.White else Color.Gray,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp
                                    )
                                }
                            }
                        }
                    }

                    // ── Saved Accounts / Quick Login Chips ──
                    if (savedAccountsList.isNotEmpty()) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 14.dp)
                                .background(Color(0xFF0F0A2A), shape = RoundedCornerShape(16.dp))
                                .border(1.dp, Color(0xFF312E81), shape = RoundedCornerShape(16.dp))
                                .padding(10.dp)
                        ) {
                            Text(
                                text = "⚡ Quick Login (Saved Accounts)",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFA78BFA),
                                modifier = Modifier.padding(bottom = 6.dp)
                            )
                            LazyRow(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                items(savedAccountsList) { acc ->
                                    Surface(
                                        shape = RoundedCornerShape(16.dp),
                                        color = if (email.equals(acc.email, ignoreCase = true)) Color(0xFF4C1D95) else Color(0xFF1E1B4B),
                                        border = androidx.compose.foundation.BorderStroke(
                                            1.dp,
                                            if (email.equals(acc.email, ignoreCase = true)) Color(0xFFA78BFA) else Color(0xFF3730A3)
                                        ),
                                        modifier = Modifier.clickable {
                                            email = acc.email
                                            password = acc.password
                                            role = acc.role
                                            Toast.makeText(context, "Loaded ${acc.email}", Toast.LENGTH_SHORT).show()
                                        }
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                                        ) {
                                            Text(if (acc.role == "admin") "🛡️" else "🎓", fontSize = 12.sp)
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Column {
                                                Text(
                                                    text = if (acc.name.isNotBlank()) acc.name else acc.email,
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = Color.White
                                                )
                                                Text(
                                                    text = acc.email,
                                                    fontSize = 9.sp,
                                                    color = Color.LightGray
                                                )
                                            }
                                            Spacer(modifier = Modifier.width(4.dp))
                                            IconButton(
                                                onClick = {
                                                    val updated = removeSavedAccount(context, acc.email)
                                                    savedAccountsList = updated
                                                    if (email.equals(acc.email, ignoreCase = true)) {
                                                        email = ""
                                                        password = ""
                                                    }
                                                },
                                                modifier = Modifier.size(16.dp)
                                            ) {
                                                Icon(
                                                    imageVector = Icons.Default.Close,
                                                    contentDescription = "Remove",
                                                    tint = Color.Gray,
                                                    modifier = Modifier.size(10.dp)
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Email Address", color = Color.LightGray) },
                        leadingIcon = { Text("📧", fontSize = 16.sp) },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Email,
                            imeAction = ImeAction.Next
                        ),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = Color(0xFF818CF8),
                            unfocusedBorderColor = Color(0xFF4338CA)
                        ),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Password", color = Color.LightGray) },
                        leadingIcon = { Text("🔒", fontSize = 16.sp) },
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Password,
                            imeAction = ImeAction.Done
                        ),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = Color(0xFF818CF8),
                            unfocusedBorderColor = Color(0xFF4338CA)
                        ),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )

                    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterEnd) {
                        TextButton(onClick = onForgotPassword) {
                            Text("Forgot Password?", color = Color(0xFF38BDF8), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    // Vibrant Submit Button
                    Button(
                        onClick = {
                            if (email.isBlank() || password.isBlank()) {
                                Toast.makeText(context, "Please fill all fields", Toast.LENGTH_SHORT).show()
                                return@Button
                            }

                            isLoading = true
                            coroutineScope.launch {
                                try {
                                    val response = ApiClient.apiService.login(LoginRequest(email, password, role))
                                    if (response.isSuccessful) {
                                        val body = response.body()
                                        if (body?.success == true && body.token != null) {
                                            val finalRole = body.user?.role ?: role
                                            val finalName = body.user?.name ?: email
                                            
                                            ApiClient.saveSession(
                                                context = context,
                                                token = body.token,
                                                userId = body.user?.id,
                                                userName = finalName,
                                                userEmail = body.user?.email,
                                                userRole = finalRole,
                                                userPhone = body.user?.phone,
                                                userStudentId = body.user?.studentId
                                            )

                                            val existingAccounts = getSavedAccounts(context)
                                            val isAlreadySaved = existingAccounts.any { it.email.equals(email, ignoreCase = true) }

                                            if (!isAlreadySaved) {
                                                pendingToken = body.token
                                                pendingRole = finalRole
                                                pendingUserName = finalName
                                                showSaveAccountDialog = true
                                            } else {
                                                saveAccount(
                                                    context,
                                                    SavedAndroidAccount(
                                                        email = email,
                                                        password = password,
                                                        role = finalRole,
                                                        name = finalName
                                                    )
                                                )
                                                Toast.makeText(context, "Welcome back!", Toast.LENGTH_SHORT).show()
                                                onLoginSuccess(body.token, finalRole)
                                            }
                                        } else {
                                            Toast.makeText(context, body?.error ?: "Invalid email or password", Toast.LENGTH_LONG).show()
                                        }
                                    } else {
                                        val errMsg = try {
                                            val errJson = response.errorBody()?.string()
                                            val type = object : TypeToken<Map<String, Any>>() {}.type
                                            val map: Map<String, Any> = Gson().fromJson(errJson, type)
                                            map["error"] as? String ?: "Login failed (${response.code()})"
                                        } catch (ex: Exception) {
                                            "Login failed (${response.code()})"
                                        }
                                        Toast.makeText(context, errMsg, Toast.LENGTH_LONG).show()
                                    }
                                } catch (e: Exception) {
                                    ApiClient.evictConnections()
                                    lastNetworkErrorMessage = "Cannot reach server at:\n$currentServerUrl\n\nMake sure the backend is running and the IP is correct."
                                    showNetworkErrorDialog = true
                                } finally {
                                    isLoading = false
                                }
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1)),
                        enabled = !isLoading
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(22.dp),
                                color = Color.White
                            )
                        } else {
                            Text("Sign In to Account →", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Secondary OTP Button
                    OutlinedButton(
                        onClick = onLoginWithOtp,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(16.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF38BDF8))
                    ) {
                        Text("🔐 Login with OTP Instead", color = Color(0xFF38BDF8), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Don't have an account?", color = Color.LightGray, fontSize = 13.sp)
                        TextButton(onClick = onSignUpClick) {
                            Text("Create Account", color = Color(0xFFA78BFA), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }
                }
            }
        }

    // ── Server IP Edit Dialog ──
    if (showServerDialog) {
        AlertDialog(
            onDismissRequest = { showServerDialog = false },
            title = {
                Text("🌐 Change Server IP / URL", fontWeight = FontWeight.Bold, fontSize = 18.sp)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Enter your computer's local Wi-Fi IP address or server URL so the app can connect to your backend.",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                    OutlinedTextField(
                        value = serverIpInput,
                        onValueChange = { serverIpInput = it },
                        label = { Text("Server URL") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                    Text("Quick Presets (Tap to fill):", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.DarkGray)
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        AssistChip(
                            onClick = { serverIpInput = "http://10.0.2.2:3001/api/" },
                            label = { Text("📱 Emulator (10.0.2.2)", fontSize = 11.sp) }
                        )
                        AssistChip(
                            onClick = { serverIpInput = "http://10.98.146.223:3001/api/" },
                            label = { Text("🌐 PC Wi-Fi", fontSize = 11.sp) }
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (serverIpInput.isNotBlank()) {
                            ApiClient.updateBaseUrl(context, serverIpInput)
                            currentServerUrl = ApiClient.currentBaseUrl
                            Toast.makeText(context, "Server URL updated to: ${ApiClient.currentBaseUrl}", Toast.LENGTH_LONG).show()
                        }
                        showServerDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3B82F6))
                ) {
                    Text("Save & Apply")
                }
            },
            dismissButton = {
                TextButton(onClick = { showServerDialog = false }) {
                    Text("Cancel", color = Color.Gray)
                }
            }
        )
    }

    // ── Network Error Auto-Recovery Dialog ──
    if (showNetworkErrorDialog) {
        AlertDialog(
            onDismissRequest = { showNetworkErrorDialog = false },
            title = {
                Text("⚠️ Connection Failed", fontWeight = FontWeight.Bold, color = Color.Red, fontSize = 18.sp)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "Unable to connect to the backend server.",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF1E293B)
                    )
                    Text(
                        text = "Current URL: $currentServerUrl\nError: $lastNetworkErrorMessage",
                        fontSize = 11.sp,
                        color = Color.DarkGray
                    )
                    Text(
                        text = "💡 Tap below to switch connection automatically!",
                        fontSize = 12.sp,
                        color = Color(0xFF2563EB)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        showNetworkErrorDialog = false
                        serverIpInput = currentServerUrl
                        showServerDialog = true
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF9333EA))
                ) {
                    Text("✏️ Change Server IP")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        ApiClient.updateBaseUrl(context, "http://10.0.2.2:3001/api/")
                        currentServerUrl = ApiClient.currentBaseUrl
                        showNetworkErrorDialog = false
                        Toast.makeText(context, "Switched to Emulator IP (10.0.2.2:3001). Try logging in again.", Toast.LENGTH_LONG).show()
                    }
                ) {
                    Text("Use 10.0.2.2 (Emulator)", fontSize = 11.sp, color = Color(0xFF2563EB))
                }
            }
        )
    }
}
}


