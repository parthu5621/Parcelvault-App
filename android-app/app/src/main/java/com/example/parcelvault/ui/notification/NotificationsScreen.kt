package com.example.parcelvault.ui.notification

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.parcelvault.api.ApiClient
import androidx.compose.ui.platform.LocalContext
import android.widget.Toast
import kotlinx.coroutines.launch

data class NotifItem(
    val id: String,
    val title: String,
    val message: String,
    val time: String,
    val isRead: Boolean,
    val type: String // "alert" | "reminder" | "update"
)

@Composable
fun NotificationsScreen() {
    var notifications by remember { mutableStateOf<List<NotifItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    fun fetchNotifications() {
        scope.launch {
            try {
                val response = ApiClient.apiService.getNotifications()
                if (response.isSuccessful && response.body()?.success == true) {
                    notifications = response.body()?.data?.map { n ->
                        // Simplify date string for layout
                        val timeStr = n.createdAt.split("T").firstOrNull() ?: n.createdAt
                        NotifItem(
                            id = n.id,
                            title = n.title,
                            message = n.message,
                            time = timeStr,
                            isRead = n.isRead,
                            type = n.type
                        )
                    } ?: emptyList()
                } else {
                    Toast.makeText(context, response.body()?.error ?: "Failed to load notifications", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(context, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        fetchNotifications()
    }

    val unreadCount = notifications.count { !it.isRead }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F0A2A))
    ) {
        // Header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF1E1B4B))
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Notifications", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                    if (unreadCount > 0)
                        Text("$unreadCount unread", color = Color(0xFF818CF8), fontSize = 13.sp)
                }
                if (unreadCount > 0) {
                    TextButton(onClick = {
                        scope.launch {
                            try {
                                val response = ApiClient.apiService.markAllNotificationsRead()
                                if (response.isSuccessful && response.body()?.success == true) {
                                    fetchNotifications()
                                } else {
                                    Toast.makeText(context, response.body()?.error ?: "Action failed", Toast.LENGTH_SHORT).show()
                                }
                            } catch (e: Exception) {
                                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                            }
                        }
                    }) {
                        Text("Mark all read", color = Color(0xFF818CF8), fontSize = 13.sp)
                    }
                }
            }
        }

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFF818CF8))
            }
        } else if (notifications.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("🔔", fontSize = 48.sp)
                    Spacer(Modifier.height(12.dp))
                    Text("No notifications", color = Color.Gray, fontSize = 16.sp)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(notifications) { notif ->
                    NotifCard(notif, onClick = {
                        if (!notif.isRead) {
                            scope.launch {
                                try {
                                    val response = ApiClient.apiService.markNotificationRead(notif.id)
                                    if (response.isSuccessful && response.body()?.success == true) {
                                        fetchNotifications()
                                    }
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                                }
                            }
                        }
                    })
                }
            }
        }
    }
}

@Composable
private fun NotifCard(notif: NotifItem, onClick: () -> Unit) {
    val typeColor = when (notif.type) {
        "alert"    -> Color(0xFF10B981)
        "reminder" -> Color(0xFFF59E0B)
        else       -> Color(0xFF6366F1)
    }
    val typeIcon = when (notif.type) {
        "alert"    -> "📦"
        "reminder" -> "⏰"
        else       -> "ℹ️"
    }

    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (notif.isRead) Color(0xFF1E1B4B) else Color(0xFF2D2A5E)
        ),
        modifier = Modifier.fillMaxWidth(),
        onClick = onClick
    ) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.Top) {
            // Icon circle
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(typeColor.copy(alpha = 0.2f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(typeIcon, fontSize = 18.sp)
            }

            Spacer(Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(notif.title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp, modifier = Modifier.weight(1f))
                    if (!notif.isRead) {
                        Box(modifier = Modifier.size(8.dp).background(Color(0xFF818CF8), CircleShape))
                    }
                }
                Spacer(Modifier.height(4.dp))
                Text(notif.message, color = Color.Gray, fontSize = 12.sp, lineHeight = 18.sp)
                Spacer(Modifier.height(6.dp))
                Text(notif.time, color = Color.Gray.copy(alpha = 0.6f), fontSize = 11.sp)
            }
        }
    }
}
