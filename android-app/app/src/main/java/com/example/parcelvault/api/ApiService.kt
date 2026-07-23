package com.example.parcelvault.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.Path
import retrofit2.http.Query

data class LoginRequest(
    val email: String,
    val password: String,
    val role: String
)

data class LoginResponse(
    val success: Boolean,
    val token: String?,
    val user: UserData?,
    val error: String?
)

data class UserData(
    val id: String,
    val name: String,
    val email: String,
    val phone: String? = null,
    val studentId: String? = null,
    val role: String
)

data class RegisterRequest(
    val name: String,
    val email: String,
    val phone: String,
    val studentId: String,
    val password: String,
    val role: String = "student"
)

data class RegisterResponse(
    val success: Boolean,
    val role: String?,
    val token: String?,
    val user: UserData?,
    val error: String?
)

data class StudentData(
    val id: String,
    val name: String,
    val email: String,
    val phone: String,
    val studentId: String
)

data class StudentsResponse(
    val success: Boolean,
    val data: List<StudentData>?,
    val error: String?
)

data class Parcel(
    val id: String,
    val trackingId: String,
    val studentId: String,
    val studentName: String,
    val studentCode: String = "",
    val description: String,
    val deliveryService: String,
    val lockerId: String?,
    val lockerLabel: String?,
    val otp: String?,
    val status: String,
    val arrivedAt: String,
    val assignedAt: String?,
    val collectedAt: String?,
    val expiresAt: String?
)

data class ParcelsResponse(
    val success: Boolean,
    val data: List<Parcel>?,
    val error: String?
)

data class Notification(
    val id: String,
    val studentId: String,
    val title: String,
    val message: String,
    val type: String,
    val isRead: Boolean,
    val createdAt: String
)

data class NotificationsResponse(
    val success: Boolean,
    val data: List<Notification>?,
    val error: String?
)

data class Locker(
    val id: String,
    val label: String,
    val section: String,
    val size: String,
    val isOccupied: Boolean,
    val currentParcelId: String?
)

data class LockersResponse(
    val success: Boolean,
    val data: List<Locker>?,
    val error: String?
)

data class AddParcelRequest(
    val studentId: String,
    val description: String,
    val deliveryService: String,
    val trackingId: String? = null
)

data class AddParcelResponse(
    val success: Boolean,
    val data: Parcel?,
    val error: String?
)

data class AssignLockerRequest(
    val lockerId: String
)

data class AssignLockerResponse(
    val success: Boolean,
    val otp: String?,
    val data: Parcel?,
    val error: String?
)

data class CollectParcelRequest(
    val otp: String
)

data class CollectParcelResponse(
    val success: Boolean,
    val data: Parcel?,
    val error: String?
)

data class GenericResponse(
    val success: Boolean,
    val message: String?,
    val error: String?
)

data class UpdateProfileRequest(
    val name: String,
    val phone: String? = null,
    val studentId: String? = null
)
data class UpdateProfileResponse(
    val success: Boolean,
    val name: String?,
    val user: UserData?,
    val error: String?
)

data class SubmitFeedbackRequest(
    val subject: String,
    val message: String,
    val email: String? = null,
    val name: String? = null
)

data class ChangePasswordRequest(val currentPassword: String, val newPassword: String)

data class ForgotPasswordRequest(val email: String)
data class ResetPasswordRequest(val email: String, val otp: String, val newPassword: String)

data class SendNotificationRequest(
    val studentId: String? = "all",
    val title: String,
    val message: String,
    val type: String = "alert"
)

data class VerifyQRRequest(
    val qrData: String? = null,
    val token: String? = null,
    val parcelId: String? = null,
    val autoConfirm: Boolean = true
)

data class VerifyQRResponse(
    val success: Boolean,
    val message: String?,
    val data: Parcel?,
    val error: String?
)

data class SendLoginOtpRequest(val email: String)
data class VerifyLoginOtpRequest(val email: String, val otp: String)
data class LoginOtpSendResponse(val success: Boolean, val message: String?, val role: String?, val error: String?)
data class ParcelStats(
    val total: Int,
    val pending: Int,
    val ready: Int,
    val collectedToday: Int,
    val expired: Int
)

data class LockerStats(
    val total: Int,
    val occupied: Int,
    val available: Int,
    val occupancyRate: Int
)

data class StudentStats(
    val total: Int
)

data class AdminDashboardStats(
    val parcels: ParcelStats,
    val lockers: LockerStats,
    val students: StudentStats
)

data class AdminStatsResponse(
    val success: Boolean,
    val data: AdminDashboardStats?,
    val error: String?
)

data class StudentDashboardStats(
    val total: Int,
    val pending: Int,
    val ready: Int,
    val collected: Int,
    val unreadNotifications: Int
)

data class StudentStatsResponse(
    val success: Boolean,
    val data: StudentDashboardStats?,
    val error: String?
)

interface ApiService {
    @GET("auth/me")
    suspend fun getMe(): Response<LoginResponse>

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<RegisterResponse>

    @GET("students")
    suspend fun getStudents(): Response<StudentsResponse>

    @GET("students/search")
    suspend fun searchStudents(@Query("q") query: String): Response<StudentsResponse>

    @GET("parcels")
    suspend fun getParcels(): Response<ParcelsResponse>

    @POST("parcels")
    suspend fun addParcel(@Body request: AddParcelRequest): Response<AddParcelResponse>

    @PATCH("parcels/{id}/assign-locker")
    suspend fun assignLocker(
        @Path("id") parcelId: String,
        @Body request: AssignLockerRequest
    ): Response<AssignLockerResponse>

    @PATCH("parcels/{id}/collect")
    suspend fun collectParcel(
        @Path("id") parcelId: String,
        @Body request: CollectParcelRequest
    ): Response<CollectParcelResponse>

    @POST("parcels/verify-qr")
    suspend fun verifyQR(@Body request: VerifyQRRequest): Response<VerifyQRResponse>

    @PATCH("parcels/{id}/release")
    suspend fun releaseLocker(
        @Path("id") parcelId: String
    ): Response<GenericResponse>

    @GET("notifications")
    suspend fun getNotifications(): Response<NotificationsResponse>

    @POST("notifications/send")
    suspend fun sendNotification(@Body request: SendNotificationRequest): Response<GenericResponse>

    @PATCH("notifications/{id}/read")
    suspend fun markNotificationRead(@Path("id") notificationId: String): Response<GenericResponse>

    @PATCH("notifications/read-all")
    suspend fun markAllNotificationsRead(): Response<GenericResponse>

    @GET("lockers")
    suspend fun getLockers(): Response<LockersResponse>

    @GET("lockers/available")
    suspend fun getAvailableLockers(): Response<LockersResponse>

    @GET("dashboard/stats")
    suspend fun getAdminStats(): Response<AdminStatsResponse>

    @GET("dashboard/student-stats")
    suspend fun getStudentStats(): Response<StudentStatsResponse>

    @PATCH("auth/update-profile")
    suspend fun updateProfile(@Body request: UpdateProfileRequest): Response<UpdateProfileResponse>

    @PATCH("auth/change-password")
    suspend fun changePassword(@Body request: ChangePasswordRequest): Response<GenericResponse>

    @POST("feedback")
    suspend fun submitFeedback(@Body request: SubmitFeedbackRequest): Response<GenericResponse>

    @POST("auth/forgot-password")
    suspend fun forgotPassword(@Body request: ForgotPasswordRequest): Response<GenericResponse>

    @POST("auth/reset-password")
    suspend fun resetPassword(@Body request: ResetPasswordRequest): Response<GenericResponse>

    @POST("auth/login-otp/send")
    suspend fun sendLoginOtp(@Body request: SendLoginOtpRequest): Response<LoginOtpSendResponse>

    @POST("auth/login-otp/verify")
    suspend fun verifyLoginOtp(@Body request: VerifyLoginOtpRequest): Response<LoginResponse>
}
