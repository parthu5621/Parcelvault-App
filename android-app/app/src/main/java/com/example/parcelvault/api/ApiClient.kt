package com.example.parcelvault.api

import android.content.Context
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import okhttp3.ConnectionPool
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import java.io.IOException
import java.util.concurrent.TimeUnit

object ApiClient {
    const val DEFAULT_BASE_URL = "http://172.16.251.223:3001/api/"
    private const val PREFS_NAME = "parcelvault_prefs"
    private const val KEY_BASE_URL = "custom_base_url"

    private const val KEY_TOKEN = "auth_token"
    private const val KEY_USER_ID = "auth_user_id"
    private const val KEY_USER_NAME = "auth_user_name"
    private const val KEY_USER_EMAIL = "auth_user_email"
    private const val KEY_USER_PHONE = "auth_user_phone"
    private const val KEY_USER_STUDENT_ID = "auth_user_student_id"
    private const val KEY_USER_ROLE = "auth_user_role"

    var currentBaseUrl: String = DEFAULT_BASE_URL
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

    private val retryInterceptor = Interceptor { chain ->
        var request = chain.request()
        if (token != null) {
            request = request.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        }

        var response: Response? = null
        var exception: Exception? = null
        var maxRetries = 3
        var tryCount = 0

        while (tryCount < maxRetries) {
            try {
                tryCount++
                response = chain.proceed(request)
                if (response.isSuccessful || response.code in 400..499) {
                    return@Interceptor response
                }
            } catch (e: Exception) {
                exception = e
                // Evict dead TCP sockets from pool when network drops/reconnects
                connectionPool.evictAll()
                if (tryCount >= maxRetries) break
                try {
                    Thread.sleep((200L * tryCount))
                } catch (_: InterruptedException) { }
            }
        }

        if (response != null) return@Interceptor response
        throw exception ?: IOException("Network error after $maxRetries retries")
    }

    private val httpClient = OkHttpClient.Builder()
        .connectionPool(connectionPool)
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .addInterceptor(retryInterceptor)
        .addInterceptor(logging)
        .build()

    private var retrofit: Retrofit = buildRetrofit(currentBaseUrl)
    var apiService: ApiService = retrofit.create(ApiService::class.java)
        private set

    fun init(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val savedUrl = prefs.getString(KEY_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL
        
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
        if (!formattedUrl.endsWith("/")) {
            formattedUrl += "/"
        }
        if (!formattedUrl.endsWith("api/")) {
            if (formattedUrl.endsWith("/")) {
                formattedUrl += "api/"
            } else {
                formattedUrl += "/api/"
            }
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

