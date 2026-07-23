package com.example.parcelvault

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

@Serializable data object Splash : NavKey
@Serializable data object Onboarding : NavKey
@Serializable data object Welcome : NavKey
@Serializable data object Main : NavKey
@Serializable data object AdminMain : NavKey
@Serializable data object Login : NavKey
@Serializable data class AdminLogin(val dummy: String = "") : NavKey
@Serializable data class Register(val dummy: String = "") : NavKey
@Serializable data class ForgotPassword(val dummy: String = "") : NavKey
@Serializable data class ResetPassword(val email: String) : NavKey
@Serializable data class LoginOtp(val dummy: String = "") : NavKey
@Serializable data class LockerMap(val dummy: String = "") : NavKey
@Serializable data class AddParcel(val dummy: String = "") : NavKey
@Serializable data class AssignLocker(val dummy: String = "") : NavKey
@Serializable data class ManageParcels(val dummy: String = "") : NavKey
@Serializable data class VerifyPickup(val dummy: String = "") : NavKey
@Serializable data class ProfileSettings(val dummy: String = "") : NavKey
@Serializable data class ParcelDetail(
    val trackingId: String,
    val description: String,
    val status: String,
    val deliveryService: String,
    val lockerLabel: String = "",
    val otp: String = "",
    val arrivedAt: String
) : NavKey
