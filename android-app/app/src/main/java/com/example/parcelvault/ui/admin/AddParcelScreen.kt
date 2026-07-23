package com.example.parcelvault.ui.admin

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.parcelvault.api.ApiClient
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddParcelScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var trackingId     by remember { mutableStateOf("") }
    var studentId      by remember { mutableStateOf("") }
    var studentName    by remember { mutableStateOf("") }
    var description    by remember { mutableStateOf("") }
    var deliveryService by remember { mutableStateOf("") }
    var isLoading      by remember { mutableStateOf(false) }

    // Student selection states
    var studentsList       by remember { mutableStateOf<List<com.example.parcelvault.api.StudentData>>(emptyList()) }
    var showStudentPicker  by remember { mutableStateOf(false) }
    var studentSearchQuery by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        try {
            val response = ApiClient.apiService.getStudents()
            if (response.isSuccessful && response.body()?.success == true) {
                studentsList = response.body()?.data ?: emptyList()
            }
        } catch (e: Exception) {
            // Silently handle
        }
    }

    val deliveryOptions = listOf("Amazon Delivery", "Flipkart Quick", "Meesho Express", "Myntra Logistics", "Blue Dart", "DTDC", "Other")
    var expanded by remember { mutableStateOf(false) }

    // Student Picker Dialog
    if (showStudentPicker) {
        AlertDialog(
            onDismissRequest = { showStudentPicker = false; studentSearchQuery = "" },
            containerColor = Color(0xFF1E1B4B),
            title = { Text("Select Student", color = Color.White, fontWeight = FontWeight.Bold) },
            text = {
                Column(modifier = Modifier.fillMaxWidth().heightIn(max = 320.dp)) {
                    OutlinedTextField(
                        value = studentSearchQuery,
                        onValueChange = { studentSearchQuery = it },
                        label = { Text("Search by name or ID", color = Color.Gray) },
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
                    Spacer(Modifier.height(12.dp))

                    val filteredStudents = studentsList.filter {
                        it.name.contains(studentSearchQuery, ignoreCase = true) ||
                        it.studentId.contains(studentSearchQuery, ignoreCase = true)
                    }

                    if (filteredStudents.isEmpty()) {
                        Box(Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                            Text("No students found", color = Color.Gray, fontSize = 14.sp)
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxWidth().weight(1f),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(filteredStudents) { std ->
                                Card(
                                    shape = RoundedCornerShape(10.dp),
                                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0F0A2A).copy(alpha = 0.5f)),
                                    modifier = Modifier.fillMaxWidth(),
                                    onClick = {
                                        studentId = std.studentId
                                        studentName = std.name
                                        showStudentPicker = false
                                        studentSearchQuery = ""
                                    }
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Text(std.name, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text("ID: ${std.studentId}", color = Color(0xFF60A5FA), fontSize = 12.sp)
                                            Text(std.email, color = Color.Gray, fontSize = 12.sp)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showStudentPicker = false; studentSearchQuery = "" }) {
                    Text("Close", color = Color.Gray)
                }
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Add New Parcel", color = Color.White) },
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
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            SectionLabel("Package Information")

            FormField(trackingId, { trackingId = it }, "Tracking ID", "e.g. PKG-2026-00005")
            FormField(description, { description = it }, "Description", "e.g. Amazon - Books")

            // Delivery service dropdown
            ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) {
                OutlinedTextField(
                    value = deliveryService,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Delivery Service") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                    modifier = Modifier.menuAnchor().fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedLabelColor = Color(0xFF818CF8),
                        unfocusedLabelColor = Color.Gray,
                        focusedBorderColor = Color(0xFF818CF8),
                        unfocusedBorderColor = Color.DarkGray,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )
                ExposedDropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false },
                    modifier = Modifier.background(Color(0xFF1E1B4B))
                ) {
                    deliveryOptions.forEach { option ->
                        DropdownMenuItem(
                            text = { Text(option, color = Color.White) },
                            onClick = { deliveryService = option; expanded = false }
                        )
                    }
                }
            }

            SectionLabel("Student Information")

            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B4B)),
                modifier = Modifier.fillMaxWidth(),
                onClick = { showStudentPicker = true }
            ) {
                Row(
                    modifier = Modifier.padding(16.dp).fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .background(Color(0xFF3B82F6).copy(alpha = 0.2f), RoundedCornerShape(12.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("🎓", fontSize = 22.sp)
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        if (studentId.isBlank()) {
                            Text("Select Student", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                            Text("Tap to search and select", color = Color.Gray, fontSize = 12.sp)
                        } else {
                            Text(studentName, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            Text("Student ID: $studentId", color = Color(0xFF60A5FA), fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                        }
                    }
                    Text("Search", color = Color(0xFF818CF8), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(Modifier.height(8.dp))

            // Info card
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E3A5F))
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.Top,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text("ℹ️", fontSize = 18.sp)
                    Text(
                        "The parcel will be marked as 'Pending' until a locker is assigned. You can assign a locker from the Admin Dashboard.",
                        color = Color(0xFF93C5FD),
                        fontSize = 13.sp,
                        lineHeight = 20.sp
                    )
                }
            }

            Button(
                onClick = {
                    when {
                        trackingId.isBlank()  -> Toast.makeText(context, "Enter tracking ID", Toast.LENGTH_SHORT).show()
                        studentId.isBlank()   -> Toast.makeText(context, "Enter student ID", Toast.LENGTH_SHORT).show()
                        description.isBlank() -> Toast.makeText(context, "Enter description", Toast.LENGTH_SHORT).show()
                        deliveryService.isBlank() -> Toast.makeText(context, "Select delivery service", Toast.LENGTH_SHORT).show()
                        else -> {
                            isLoading = true
                            scope.launch {
                                try {
                                    val response = ApiClient.apiService.addParcel(
                                        com.example.parcelvault.api.AddParcelRequest(
                                            studentId = studentId,
                                            description = description,
                                            deliveryService = deliveryService,
                                            trackingId = trackingId.ifBlank { null }
                                        )
                                    )
                                    if (response.isSuccessful && response.body()?.success == true) {
                                        Toast.makeText(context, "✅ Parcel added successfully!", Toast.LENGTH_SHORT).show()
                                        onBack()
                                    } else {
                                        Toast.makeText(context, response.body()?.error ?: "Failed to add parcel", Toast.LENGTH_SHORT).show()
                                    }
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                                } finally {
                                    isLoading = false
                                }
                            }
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3B82F6)),
                enabled = !isLoading
            ) {
                if (isLoading) CircularProgressIndicator(modifier = Modifier.size(22.dp), color = Color.White)
                else Text("Add Parcel", fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }

            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun SectionLabel(text: String) {
    Text(text, color = Color(0xFF818CF8), fontSize = 13.sp, fontWeight = FontWeight.SemiBold,
        modifier = Modifier.padding(top = 4.dp))
}

@Composable
private fun FormField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    placeholder: String,
    keyboardType: KeyboardType = KeyboardType.Text
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        placeholder = { Text(placeholder, color = Color.Gray) },
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType, imeAction = ImeAction.Next),
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedLabelColor = Color(0xFF818CF8),
            unfocusedLabelColor = Color.Gray,
            focusedBorderColor = Color(0xFF818CF8),
            unfocusedBorderColor = Color.DarkGray,
            focusedTextColor = Color.White,
            unfocusedTextColor = Color.White
        )
    )
}
