package com.example.parcelvault.ui.auth

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
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
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.launch

@Composable
fun RegisterScreen(
    onBack: () -> Unit,
    onRegistered: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var studentId by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirm by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("student") }
    var isLoading by remember { mutableStateOf(false) }

    val gradient = Brush.verticalGradient(
        listOf(
            Color(0xFF0F0A2A),
            Color(0xFF1E1B4B),
            Color(0xFF312E81)
        )
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(gradient)
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B4B)),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF3730A3)),
            elevation = CardDefaults.cardElevation(defaultElevation = 16.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(22.dp)
            ) {
                // Header Row
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                    Spacer(Modifier.width(4.dp))
                    Column {
                        Text("Create Account 🚀", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Text("Join ParcelVault Smart Campus", fontSize = 12.sp, color = Color.LightGray)
                    }
                }

                Spacer(Modifier.height(14.dp))

                // Segmented Role Selector
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0xFF0F0A2A),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF312E81)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 14.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(4.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = if (role == "student") Color(0xFF6366F1) else Color.Transparent,
                            modifier = Modifier
                                .weight(1f)
                                .clickable { role = "student" }
                        ) {
                            Box(contentAlignment = Alignment.Center, modifier = Modifier.padding(vertical = 10.dp)) {
                                Text("🎓 Student Account", color = if (role == "student") Color.White else Color.Gray, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = if (role == "admin") Color(0xFFA855F7) else Color.Transparent,
                            modifier = Modifier
                                .weight(1f)
                                .clickable { role = "admin" }
                        ) {
                            Box(contentAlignment = Alignment.Center, modifier = Modifier.padding(vertical = 10.dp)) {
                                Text("🛡️ Admin Staff", color = if (role == "admin") Color.White else Color.Gray, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    }
                }

                // Input fields inside a scrollable column if screen is short
                androidx.compose.foundation.rememberScrollState().let { scrollState ->
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f, fill = false)
                    ) {
                        OutlinedTextField(
                            value = name,
                            onValueChange = { name = it },
                            label = { Text("Full Name *", color = Color.LightGray) },
                            leadingIcon = { Text("👤", fontSize = 16.sp) },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text, imeAction = ImeAction.Next),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                focusedBorderColor = Color(0xFF818CF8),
                                unfocusedBorderColor = Color(0xFF4338CA)
                            ),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(14.dp)
                        )
                        Spacer(Modifier.height(10.dp))

                        OutlinedTextField(
                            value = email,
                            onValueChange = { email = it },
                            label = { Text("Email Address *", color = Color.LightGray) },
                            leadingIcon = { Text("📧", fontSize = 16.sp) },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                focusedBorderColor = Color(0xFF818CF8),
                                unfocusedBorderColor = Color(0xFF4338CA)
                            ),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(14.dp)
                        )
                        Spacer(Modifier.height(10.dp))

                        if (role == "student") {
                            OutlinedTextField(
                                value = phone,
                                onValueChange = { phone = it },
                                label = { Text("Phone Number *", color = Color.LightGray) },
                                leadingIcon = { Text("📱", fontSize = 16.sp) },
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone, imeAction = ImeAction.Next),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.White,
                                    focusedBorderColor = Color(0xFF818CF8),
                                    unfocusedBorderColor = Color(0xFF4338CA)
                                ),
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp)
                            )
                            Spacer(Modifier.height(10.dp))

                            OutlinedTextField(
                                value = studentId,
                                onValueChange = { studentId = it },
                                label = { Text("Student ID (e.g. STU001) *", color = Color.LightGray) },
                                leadingIcon = { Text("🪪", fontSize = 16.sp) },
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text, imeAction = ImeAction.Next),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.White,
                                    focusedBorderColor = Color(0xFF818CF8),
                                    unfocusedBorderColor = Color(0xFF4338CA)
                                ),
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp)
                            )
                            Spacer(Modifier.height(10.dp))
                        }

                        OutlinedTextField(
                            value = password,
                            onValueChange = { password = it },
                            label = { Text("Password *", color = Color.LightGray) },
                            leadingIcon = { Text("🔒", fontSize = 16.sp) },
                            singleLine = true,
                            visualTransformation = PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Next),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                focusedBorderColor = Color(0xFF818CF8),
                                unfocusedBorderColor = Color(0xFF4338CA)
                            ),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(14.dp)
                        )
                        Spacer(Modifier.height(10.dp))

                        OutlinedTextField(
                            value = confirm,
                            onValueChange = { confirm = it },
                            label = { Text("Confirm Password *", color = Color.LightGray) },
                            leadingIcon = { Text("🔐", fontSize = 16.sp) },
                            singleLine = true,
                            visualTransformation = PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                focusedBorderColor = Color(0xFF818CF8),
                                unfocusedBorderColor = Color(0xFF4338CA)
                            ),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(14.dp)
                        )
                    }
                }

                Spacer(Modifier.height(16.dp))

                Button(
                    onClick = {
                        val isInvalid = name.isBlank() || email.isBlank() || password.isBlank() ||
                                (role == "student" && (phone.isBlank() || studentId.isBlank()))
                        when {
                            isInvalid ->
                                Toast.makeText(context, "Please fill all fields", Toast.LENGTH_SHORT).show()
                            password != confirm ->
                                Toast.makeText(context, "Passwords do not match", Toast.LENGTH_SHORT).show()
                            else -> {
                                isLoading = true
                                scope.launch {
                                    try {
                                        val response = ApiClient.apiService.register(
                                            com.example.parcelvault.api.RegisterRequest(
                                                name = name,
                                                email = email,
                                                phone = if (role == "student") phone else "",
                                                studentId = if (role == "student") studentId else "",
                                                password = password,
                                                role = role
                                            )
                                        )
                                        if (response.isSuccessful) {
                                            val body = response.body()
                                            if (body?.success == true && body.token != null) {
                                                val finalRole = body.role ?: body.user?.role ?: role
                                                ApiClient.saveSession(
                                                    context = context,
                                                    token = body.token,
                                                    userId = body.user?.id,
                                                    userName = body.user?.name ?: name,
                                                    userEmail = body.user?.email ?: email,
                                                    userRole = finalRole,
                                                    userPhone = body.user?.phone ?: phone,
                                                    userStudentId = body.user?.studentId ?: studentId
                                                )
                                                Toast.makeText(context, "Account created successfully! Welcome!", Toast.LENGTH_SHORT).show()
                                                onRegistered()
                                            } else {
                                                Toast.makeText(context, body?.error ?: "Registration failed", Toast.LENGTH_SHORT).show()
                                            }
                                        } else {
                                            val errMsg = try {
                                                val errJson = response.errorBody()?.string()
                                                val type = object : TypeToken<Map<String, Any>>() {}.type
                                                val map: Map<String, Any> = Gson().fromJson(errJson, type)
                                                map["error"] as? String ?: "Registration failed (${response.code()})"
                                            } catch (ex: Exception) {
                                                "Registration failed (${response.code()})"
                                            }
                                            Toast.makeText(context, errMsg, Toast.LENGTH_LONG).show()
                                        }
                                    } catch (e: Exception) {
                                        Toast.makeText(context, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
                                    } finally {
                                        isLoading = false
                                    }
                                }
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFA855F7)),
                    enabled = !isLoading
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(22.dp),
                            color = Color.White
                        )
                    } else {
                        Text("Complete Registration ✨", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    }
                }
            }
        }
    }
}
