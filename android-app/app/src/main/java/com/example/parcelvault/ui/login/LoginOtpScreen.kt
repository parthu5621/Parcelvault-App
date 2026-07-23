package com.example.parcelvault.ui.login

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.parcelvault.api.ApiClient
import com.example.parcelvault.api.SendLoginOtpRequest
import com.example.parcelvault.api.VerifyLoginOtpRequest
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.launch

@Composable
fun LoginOtpScreen(
    onBack: () -> Unit,
    onLoginSuccess: (String, String) -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var email by remember { mutableStateOf("") }
    var otp by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var otpSent by remember { mutableStateOf(false) }

    val gradient = Brush.verticalGradient(
        colors = listOf(
            Color(0xFF0F0A2A),
            Color(0xFF1E1B4B),
            Color(0xFF312E81)
        )
    )

    Box(
        modifier = Modifier.fillMaxSize().background(gradient).padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B4B)),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF3730A3)),
            elevation = CardDefaults.cardElevation(defaultElevation = 16.dp),
            modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp)
        ) {
            Column(modifier = Modifier.padding(24.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                    Spacer(Modifier.width(4.dp))
                    Column {
                        Text(
                            if (!otpSent) "Login with OTP 🔐" else "Enter Verification OTP ⚡",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            if (!otpSent) "We'll send a 6-digit code to your email" else "Check your inbox for the 6-digit code",
                            fontSize = 12.sp,
                            color = Color.LightGray
                        )
                    }
                }

                Spacer(Modifier.height(20.dp))

                if (!otpSent) {
                    // ── Step 1: Email Input ──
                    Text("📧", fontSize = 44.sp, modifier = Modifier.align(Alignment.CenterHorizontally))
                    Spacer(Modifier.height(14.dp))

                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Registered Email Address", color = Color.LightGray) },
                        leadingIcon = { Text("👤", fontSize = 16.sp) },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Done),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = Color(0xFF818CF8),
                            unfocusedBorderColor = Color(0xFF4338CA)
                        ),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )

                    Spacer(Modifier.height(18.dp))

                    Button(
                        onClick = {
                            if (email.isBlank()) {
                                Toast.makeText(context, "Enter your email", Toast.LENGTH_SHORT).show()
                                return@Button
                            }
                            isLoading = true
                            coroutineScope.launch {
                                try {
                                    val response = ApiClient.apiService.sendLoginOtp(SendLoginOtpRequest(email))
                                    if (response.isSuccessful && response.body()?.success == true) {
                                        Toast.makeText(context, "OTP sent to your email!", Toast.LENGTH_LONG).show()
                                        otpSent = true
                                    } else {
                                        val errMsg = try {
                                            val errJson = response.errorBody()?.string()
                                            val type = object : TypeToken<Map<String, Any>>() {}.type
                                            val map: Map<String, Any> = Gson().fromJson(errJson, type)
                                            map["error"] as? String ?: "Failed to send OTP"
                                        } catch (ex: Exception) {
                                            "Failed to send OTP (${response.code()})"
                                        }
                                        Toast.makeText(context, errMsg, Toast.LENGTH_LONG).show()
                                    }
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
                                } finally {
                                    isLoading = false
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth().height(50.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1)),
                        enabled = !isLoading
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(modifier = Modifier.size(22.dp), color = Color.White)
                        } else {
                            Text("Send OTP Code →", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }
                    }
                } else {
                    // ── Step 2: OTP Verification ──
                    Text("🔐", fontSize = 44.sp, modifier = Modifier.align(Alignment.CenterHorizontally))
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "OTP sent to:\n$email",
                        fontSize = 13.sp,
                        color = Color(0xFF6EE7B7),
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(Modifier.height(16.dp))

                    OutlinedTextField(
                        value = otp,
                        onValueChange = { otp = it },
                        label = { Text("Enter 6-Digit OTP", color = Color.LightGray) },
                        leadingIcon = { Text("⚡", fontSize = 16.sp) },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = Color(0xFF818CF8),
                            unfocusedBorderColor = Color(0xFF4338CA)
                        ),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )

                    Spacer(Modifier.height(18.dp))

                    Button(
                        onClick = {
                            if (otp.isBlank()) {
                                Toast.makeText(context, "Enter the OTP", Toast.LENGTH_SHORT).show()
                                return@Button
                            }
                            isLoading = true
                            coroutineScope.launch {
                                try {
                                    val response = ApiClient.apiService.verifyLoginOtp(VerifyLoginOtpRequest(email, otp))
                                    if (response.isSuccessful) {
                                        val body = response.body()
                                        if (body?.success == true && body.token != null) {
                                            val user = body.user
                                            val userRole = user?.role ?: "student"
                                            ApiClient.saveSession(
                                                context = context,
                                                token = body.token,
                                                userId = user?.id,
                                                userName = user?.name,
                                                userEmail = user?.email,
                                                userPhone = user?.phone,
                                                userStudentId = user?.studentId,
                                                userRole = userRole
                                            )
                                            Toast.makeText(context, "Login successful!", Toast.LENGTH_SHORT).show()
                                            onLoginSuccess(body.token, userRole)
                                        } else {
                                            Toast.makeText(context, body?.error ?: "Verification failed", Toast.LENGTH_SHORT).show()
                                        }
                                    } else {
                                        val errMsg = try {
                                            val errJson = response.errorBody()?.string()
                                            val type = object : TypeToken<Map<String, Any>>() {}.type
                                            val map: Map<String, Any> = Gson().fromJson(errJson, type)
                                            map["error"] as? String ?: "Verification failed"
                                        } catch (ex: Exception) {
                                            "Verification failed (${response.code()})"
                                        }
                                        Toast.makeText(context, errMsg, Toast.LENGTH_LONG).show()
                                    }
                                } catch (e: Exception) {
                                    ApiClient.evictConnections()
                                    Toast.makeText(context, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
                                } finally {
                                    isLoading = false
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth().height(50.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFA855F7)),
                        enabled = !isLoading
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(modifier = Modifier.size(22.dp), color = Color.White)
                        } else {
                            Text("Verify OTP & Login →", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }
                    }

                    Spacer(Modifier.height(10.dp))

                    TextButton(
                        onClick = {
                            otp = ""
                            otpSent = false
                        },
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    ) {
                        Text("↩ Use a different email", color = Color(0xFF38BDF8), fontSize = 13.sp)
                    }
                }
            }
        }
    }
}
