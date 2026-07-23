package com.example.parcelvault.ui.locker

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
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

data class LockerCell(
    val id: String,
    val label: String,
    val section: String,
    val size: String,
    val isOccupied: Boolean
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LockerAvailabilityScreen(onBack: () -> Unit) {
    var lockers by remember { mutableStateOf<List<LockerCell>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        try {
            val response = ApiClient.apiService.getLockers()
            if (response.isSuccessful && response.body()?.success == true) {
                lockers = response.body()?.data?.map { l ->
                    LockerCell(
                        id = l.id,
                        label = l.label,
                        section = l.section,
                        size = l.size,
                        isOccupied = l.isOccupied
                    )
                } ?: emptyList()
            } else {
                Toast.makeText(context, response.body()?.error ?: "Failed to load lockers", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            Toast.makeText(context, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
        } finally {
            isLoading = false
        }
    }

    val sections = lockers.map { it.section }.distinct().sorted()
    var selectedSection by remember { mutableStateOf("") }
    if (selectedSection.isEmpty() && sections.isNotEmpty()) {
        selectedSection = sections.first()
    }

    val filtered = lockers.filter { it.section == selectedSection }
    val availableCount = filtered.count { !it.isOccupied }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Locker Availability", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1E1B4B))
            )
        },
        containerColor = Color(0xFF0F0A2A)
    ) { padding ->
        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = Color(0xFF818CF8))
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp)
            ) {
                // Legend row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    LegendItem(Color(0xFF10B981), "Available ($availableCount)")
                    LegendItem(Color(0xFFEF4444), "Occupied (${filtered.size - availableCount})")
                }

                Spacer(Modifier.height(16.dp))

                // Section tabs
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    sections.forEach { sec ->
                        val locationName = when(sec) {
                            "A" -> "Section A (Main Hub)"
                            "B" -> "Section B (North Hostel)"
                            "C" -> "Section C (Library)"
                            else -> "Section $sec"
                        }
                        FilterChip(
                            selected = selectedSection == sec,
                            onClick = { selectedSection = sec },
                            label = { Text(locationName) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = Color(0xFF6366F1),
                                selectedLabelColor = Color.White,
                                containerColor = Color(0xFF1E1B4B),
                                labelColor = Color.Gray
                            )
                        )
                    }
                }

                Spacer(Modifier.height(16.dp))

                // Grid of lockers
                if (filtered.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("No lockers in this section.", color = Color.Gray, fontSize = 14.sp)
                    }
                } else {
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(3),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(filtered) { locker ->
                            LockerGridCell(locker)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun LockerGridCell(locker: LockerCell) {
    val bgColor = if (locker.isOccupied) Color(0xFF7F1D1D).copy(alpha = 0.7f) else Color(0xFF064E3B).copy(alpha = 0.7f)
    val borderColor = if (locker.isOccupied) Color(0xFFEF4444) else Color(0xFF10B981)
    val icon = when (locker.size) { "small" -> "📦" ; "medium" -> "📫" ; else -> "🗄️" }

    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = bgColor),
        border = CardDefaults.outlinedCardBorder().copy(),
        modifier = Modifier.aspectRatio(1f)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(bgColor, RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(icon, fontSize = 24.sp)
                Spacer(Modifier.height(4.dp))
                Text(locker.label, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                Text(locker.size, color = borderColor, fontSize = 10.sp)
                Text(if (locker.isOccupied) "Occupied" else "Free", color = borderColor, fontSize = 10.sp)
            }
        }
    }
}

@Composable
private fun LegendItem(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(modifier = Modifier.size(12.dp).background(color, RoundedCornerShape(3.dp)))
        Text(label, color = Color.White, fontSize = 13.sp)
    }
}
