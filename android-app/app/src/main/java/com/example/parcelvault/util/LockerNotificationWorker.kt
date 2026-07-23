package com.example.parcelvault.util

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.example.parcelvault.api.ApiClient

class LockerNotificationWorker(
    private val context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            ApiClient.init(context)
            val token = ApiClient.token
            if (!token.isNullOrBlank()) {
                val response = ApiClient.apiService.getNotifications()
                if (response.isSuccessful && response.body()?.success == true) {
                    val unread = response.body()?.data?.filter { !it.isRead } ?: emptyList()
                    for (notif in unread) {
                        NotificationHelper.showSystemNotification(
                            context = context,
                            title = notif.title,
                            message = notif.message,
                            notificationId = notif.id.hashCode()
                        )
                    }
                }
            }
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
