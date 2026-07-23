package com.example.parcelvault.ui.auth

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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

import com.example.parcelvault.api.ApiClient
import com.example.parcelvault.api.ForgotPasswordRequest
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.launch

@Composable
fun ForgotPasswordScreen(
    onBack: () -> Unit,
    onNavigateToReset: (String) -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    var email by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var sent by remember { mutableStateOf(false) }

    val gradient = Brush.verticalGradient(listOf(Color(0xFF1E1B4B), Color(0xFF3B82F6)))

    Box(
        modifier = Modifier.fillMaxSize().background(gradient),
        contentAlignment = Alignment.Center
    ) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth().padding(24.dp)
        ) {
            Column(modifier = Modifier.padding(28.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.DarkGray)
                    }
                    Spacer(Modifier.width(4.dp))
                    Column {
                        Text("Forgot Password", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
                        Text("We'll send you a reset link", fontSize = 13.sp, color = Color.Gray)
                    }
                }

                Spacer(Modifier.height(24.dp))

                if (!sent) {
                    Text("🔐", fontSize = 48.sp, modifier = Modifier.align(Alignment.CenterHorizontally))
                    Spacer(Modifier.height(16.dp))

                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Email Address") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Done),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(Modifier.height(20.dp))

                    Button(
                        onClick = {
                            if (email.isBlank()) {
                                Toast.makeText(context, "Enter your email", Toast.LENGTH_SHORT).show()
                                return@Button
                            }
                            isLoading = true
                            coroutineScope.launch {
                                try {
                                    val response = ApiClient.apiService.forgotPassword(ForgotPasswordRequest(email))
                                    if (response.isSuccessful && response.body()?.success == true) {
                                        Toast.makeText(context, "OTP sent to your email", Toast.LENGTH_LONG).show()
                                        onNavigateToReset(email)
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
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3B82F6)),
                        enabled = !isLoading
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
                        } else {
                            Text("Send Reset Link", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
