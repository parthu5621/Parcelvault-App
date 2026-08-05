package com.example.parcelvault.api

import android.content.Context
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import okhttp3.ConnectionPool
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import java.io.IOException
import java.util.concurrent.TimeUnit

object ApiClient {
    fun isEmulator(): Boolean {
        return (android.os.Build.FINGERPRINT.startsWith("generic")
                || android.os.Build.FINGERPRINT.startsWith("unknown")
                || android.os.Build.MODEL.contains("google_sdk")
                || android.os.Build.MODEL.contains("Emulator")
                || android.os.Build.MODEL.contains("Android SDK built for x86")
                || android.os.Build.MANUFACTURER.contains("Genymotion")
                || android.os.Build.HARDWARE.contains("goldfish")
                || android.os.Build.HARDWARE.contains("ranchu"))
    }

    val defaultBaseUrl: String
        get() = if (isEmulator()) "http://10.0.2.2:3001/api/" else "http://127.0.0.1:3001/api/"

    const val DEFAULT_BASE_URL = "http://10.0.2.2:3001/api/"
    private const val PREFS_NAME = "parcelvault_prefs"
    private const val KEY_BASE_URL = "custom_base_url"

    private const val KEY_TOKEN = "auth_token"
    private const val KEY_USER_ID = "auth_user_id"
    private const val KEY_USER_NAME = "auth_user_name"
    private const val KEY_USER_EMAIL = "auth_user_email"
    private const val KEY_USER_PHONE = "auth_user_phone"
    private const val KEY_USER_STUDENT_ID = "auth_user_student_id"
    private const val KEY_USER_ROLE = "auth_user_role"

    var currentBaseUrl: String = "http://10.0.2.2:3001/api/"
        private set

    // Session fields
    var token: String? = null
    var userId: String? = null
    var userName: String? = null
    var userEmail: String? = null
    var userPhone: String? = null
    var userStudentId: String? = null
    var userRole: String? = null

    private val connectionPool = ConnectionPool(5, 5, TimeUnit.MINUTES)

    private val logging = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private var appContext: Context? = null

    private val retryInterceptor = Interceptor { chain ->
        var originalRequest = chain.request()
        if (token != null) {
            originalRequest = originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        }

        // 1. Try original request on current base URL
        try {
            val response = chain.proceed(originalRequest)
            if (response.isSuccessful || response.code in 400..499) {
                return@Interceptor response
            }
        } catch (_: Exception) {
            // Network connection failed on currentBaseUrl, fallback to auto-discovery
        }

        // 2. Candidate URLs for auto-discovery fallback (Emulator vs Physical Device)
        val candidateUrls = if (isEmulator()) {
            listOf(
                "http://10.0.2.2:3001/api/",
                "http://127.0.0.1:3001/api/",
                "http://localhost:3001/api/",
                "http://10.98.146.223:3001/api/",
                "http://172.16.251.223:3001/api/"
            )
        } else {
            listOf(
                "http://127.0.0.1:3001/api/",
                "http://10.0.2.2:3001/api/",
                "http://localhost:3001/api/",
                "http://10.98.146.223:3001/api/",
                "http://172.16.251.223:3001/api/"
            )
        }.filter { !it.equals(currentBaseUrl, ignoreCase = true) }

        connectionPool.evictAll()

        for (targetUrl in candidateUrls) {
            try {
                val fullPath = originalRequest.url.encodedPath + (if (originalRequest.url.encodedQuery != null) "?${originalRequest.url.encodedQuery}" else "")
                val newUrlStr = targetUrl.removeSuffix("/") + fullPath
                val newHttpUrl = newUrlStr.toHttpUrlOrNull() ?: continue

                val newRequest = originalRequest.newBuilder()
                    .url(newHttpUrl)
                    .build()

                val fastChain = chain.withConnectTimeout(2, TimeUnit.SECONDS)
                    .withReadTimeout(3, TimeUnit.SECONDS)
                val fallbackResponse = fastChain.proceed(newRequest)
                if (fallbackResponse.isSuccessful || fallbackResponse.code in 400..499) {
                    // Automatically update base URL so future requests use the working IP instantly
                    appContext?.let { ctx ->
                        updateBaseUrl(ctx, targetUrl)
                    }
                    return@Interceptor fallbackResponse
                }
            } catch (_: Exception) {
                connectionPool.evictAll()
            }
        }

        // 3. Final attempt with original request to produce standard exception if all fail
        connectionPool.evictAll()
        return@Interceptor chain.proceed(originalRequest)
    }

    private val httpClient = OkHttpClient.Builder()
        .connectionPool(connectionPool)
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .addInterceptor(retryInterceptor)
        .addInterceptor(logging)
        .build()

    private var retrofit: Retrofit = buildRetrofit(currentBaseUrl)
    var apiService: ApiService = retrofit.create(ApiService::class.java)
        private set

    fun init(context: Context) {
        appContext = context.applicationContext
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val initialDefault = defaultBaseUrl
        val savedUrl = prefs.getString(KEY_BASE_URL, initialDefault) ?: initialDefault
        
        token = prefs.getString(KEY_TOKEN, null)
        userId = prefs.getString(KEY_USER_ID, null)
        userName = prefs.getString(KEY_USER_NAME, null)
        userEmail = prefs.getString(KEY_USER_EMAIL, null)
        userPhone = prefs.getString(KEY_USER_PHONE, null)
        userStudentId = prefs.getString(KEY_USER_STUDENT_ID, null)
        userRole = prefs.getString(KEY_USER_ROLE, null)

        updateBaseUrl(context, savedUrl)
    }

    fun saveSession(context: Context, token: String, userId: String?, userName: String?, userEmail: String?, userPhone: String?, userStudentId: String?, userRole: String?) {
        this.token = token
        this.userId = userId
        this.userName = userName
        this.userEmail = userEmail
        this.userPhone = userPhone
        this.userStudentId = userStudentId
        this.userRole = userRole

        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_TOKEN, token)
            .putString(KEY_USER_ID, userId)
            .putString(KEY_USER_NAME, userName)
            .putString(KEY_USER_EMAIL, userEmail)
            .putString(KEY_USER_PHONE, userPhone)
            .putString(KEY_USER_STUDENT_ID, userStudentId)
            .putString(KEY_USER_ROLE, userRole)
            .apply()
    }

    fun hasValidSession(): Boolean {
        return !token.isNullOrBlank()
    }

    fun clearSession(context: Context) {
        token = null
        userId = null
        userName = null
        userEmail = null
        userPhone = null
        userStudentId = null
        userRole = null

        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .remove(KEY_TOKEN)
            .remove(KEY_USER_ID)
            .remove(KEY_USER_NAME)
            .remove(KEY_USER_EMAIL)
            .remove(KEY_USER_PHONE)
            .remove(KEY_USER_STUDENT_ID)
            .remove(KEY_USER_ROLE)
            .apply()
    }

    fun evictConnections() {
        try {
            connectionPool.evictAll()
        } catch (_: Exception) {}
    }

    fun updateBaseUrl(context: Context, newUrl: String) {
        var formattedUrl = newUrl.trim()
        try {
            if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
                formattedUrl = "http://$formattedUrl"
            }
            val uri = java.net.URI.create(formattedUrl)
            val scheme = uri.scheme ?: "http"
            val host = uri.host ?: return
            val port = if (uri.port != -1) uri.port else 3001
            formattedUrl = "$scheme://$host:$port/api/"
        } catch (_: Exception) {
            if (!formattedUrl.endsWith("/")) formattedUrl += "/"
            if (!formattedUrl.endsWith("api/")) formattedUrl += "api/"
        }

        currentBaseUrl = formattedUrl
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_BASE_URL, formattedUrl)
            .apply()

        evictConnections()
        retrofit = buildRetrofit(currentBaseUrl)
        apiService = retrofit.create(ApiService::class.java)
    }

    private fun buildRetrofit(url: String): Retrofit {
        return Retrofit.Builder()
            .baseUrl(url)
            .addConverterFactory(GsonConverterFactory.create())
            .client(httpClient)
            .build()
    }
}

