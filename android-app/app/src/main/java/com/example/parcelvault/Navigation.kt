package com.example.parcelvault

import androidx.compose.runtime.Composable
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import com.example.parcelvault.ui.admin.AddParcelScreen
import com.example.parcelvault.ui.admin.AdminDashboardScreen
import com.example.parcelvault.ui.admin.AssignLockerScreen
import com.example.parcelvault.ui.admin.ManageParcelsScreen
import com.example.parcelvault.ui.admin.VerifyPickupScreen
import com.example.parcelvault.ui.auth.ForgotPasswordScreen
import com.example.parcelvault.ui.auth.ResetPasswordScreen
import com.example.parcelvault.ui.auth.RegisterScreen
import com.example.parcelvault.ui.locker.LockerAvailabilityScreen
import com.example.parcelvault.ui.login.LoginScreen
import com.example.parcelvault.ui.login.LoginOtpScreen
import com.example.parcelvault.ui.main.MainScreen
import com.example.parcelvault.ui.onboarding.OnboardingScreen
import com.example.parcelvault.ui.parcel.ParcelDetailScreen
import com.example.parcelvault.ui.profile.ProfileSettingsScreen
import com.example.parcelvault.ui.splash.SplashScreen
import com.example.parcelvault.ui.welcome.WelcomeScreen

@Composable
fun MainNavigation() {
    val backStack = rememberNavBackStack(Splash)

    NavDisplay(
        backStack = backStack,
        onBack = { backStack.removeLastOrNull() },
        entryProvider = entryProvider {

            // ── Splash ───────────────────────────────────────────────────────
            entry<Splash> {
                val context = androidx.compose.ui.platform.LocalContext.current
                SplashScreen(onFinished = {
                    backStack.clear()
                    if (com.example.parcelvault.api.ApiClient.hasValidSession()) {
                        if (com.example.parcelvault.api.ApiClient.userRole == "admin") {
                            backStack.add(AdminMain)
                        } else {
                            backStack.add(Main)
                        }
                    } else {
                        backStack.add(Onboarding)
                    }
                })
            }

            // ── Onboarding ───────────────────────────────────────────────────
            entry<Onboarding> {
                OnboardingScreen(onFinished = {
                    backStack.clear()
                    backStack.add(Welcome)
                })
            }

            // ── Welcome ──────────────────────────────────────────────────────
            entry<Welcome> {
                WelcomeScreen(
                    onStudentLogin = { backStack.add(Login) },
                    onAdminLogin   = { backStack.add(AdminLogin()) },
                    onRegister     = { backStack.add(Register()) }
                )
            }

            // ── Student Login ────────────────────────────────────────────────
            entry<Login> {
                LoginScreen(
                    onLoginSuccess = { _, role ->
                        backStack.clear()
                        if (role == "admin") backStack.add(AdminMain)
                        else backStack.add(Main)
                    },
                    onForgotPassword = { backStack.add(ForgotPassword()) },
                    onSignUpClick = { backStack.add(Register()) },
                    onLoginWithOtp = { backStack.add(LoginOtp()) }
                )
            }

            // ── Admin Login ──────────────────────────────────────────────────
            entry<AdminLogin> {
                LoginScreen(
                    isAdmin = true,
                    onLoginSuccess = { _, role ->
                        backStack.clear()
                        if (role == "admin") backStack.add(AdminMain)
                        else backStack.add(Main)
                    },
                    onForgotPassword = { backStack.add(ForgotPassword()) },
                    onSignUpClick = { backStack.add(Register()) },
                    onLoginWithOtp = { backStack.add(LoginOtp()) }
                )
            }

            // ── Register ─────────────────────────────────────────────────────
            entry<Register> {
                RegisterScreen(
                    onBack = { backStack.removeLastOrNull() },
                    onRegistered = {
                        if (com.example.parcelvault.api.ApiClient.hasValidSession()) {
                            backStack.clear()
                            if (com.example.parcelvault.api.ApiClient.userRole == "admin") {
                                backStack.add(AdminMain)
                            } else {
                                backStack.add(Main)
                            }
                        } else {
                            backStack.removeLastOrNull()
                        }
                    }
                )
            }

            // ── Forgot Password ──────────────────────────────────────────────
            entry<ForgotPassword> {
                ForgotPasswordScreen(
                    onBack = { backStack.removeLastOrNull() },
                    onNavigateToReset = { email -> 
                        backStack.removeLastOrNull()
                        backStack.add(ResetPassword(email))
                    }
                )
            }

            // ── Reset Password ──────────────────────────────────────────────
            entry<ResetPassword> { key ->
                ResetPasswordScreen(
                    email = key.email,
                    onBack = { backStack.removeLastOrNull() },
                    onResetSuccess = {
                        backStack.removeLastOrNull()
                    }
                )
            }

            // ── Login with OTP ──────────────────────────────────────────────
            entry<LoginOtp> {
                LoginOtpScreen(
                    onBack = { backStack.removeLastOrNull() },
                    onLoginSuccess = { _, role ->
                        backStack.clear()
                        if (role == "admin") backStack.add(AdminMain)
                        else backStack.add(Main)
                    }
                )
            }

            // ── Student Main Dashboard ───────────────────────────────────────
            entry<Main> {
                val context = androidx.compose.ui.platform.LocalContext.current
                MainScreen(
                    onParcelClick    = { parcel -> backStack.add(parcel) },
                    onLockerMapClick = { backStack.add(LockerMap()) },
                    onSignOut        = {
                        com.example.parcelvault.api.ApiClient.clearSession(context)
                        backStack.clear()
                        backStack.add(Welcome)
                    },
                    onSettingsClick  = { backStack.add(ProfileSettings()) }
                )
            }

            // ── Admin Main Dashboard ─────────────────────────────────────────
            entry<AdminMain> {
                val context = androidx.compose.ui.platform.LocalContext.current
                AdminDashboardScreen(
                    onAddParcel      = { backStack.add(AddParcel()) },
                    onAssignLocker   = { backStack.add(AssignLocker()) },
                    onViewParcels    = { backStack.add(ManageParcels()) },
                    onLockerMap      = { backStack.add(LockerMap()) },
                    onVerifyPickup   = { backStack.add(VerifyPickup()) },
                    onSettingsClick  = { backStack.add(ProfileSettings()) },
                    onLogout         = {
                        com.example.parcelvault.api.ApiClient.clearSession(context)
                        backStack.clear()
                        backStack.add(Welcome)
                    }
                )
            }

            // ── Add Parcel ───────────────────────────────────────────────────
            entry<AddParcel> {
                AddParcelScreen(onBack = { backStack.removeLastOrNull() })
            }

            // ── Assign Locker ────────────────────────────────────────────────
            entry<AssignLocker> {
                AssignLockerScreen(onBack = { backStack.removeLastOrNull() })
            }

            // ── Parcel Detail ────────────────────────────────────────────────
            entry<ParcelDetail> { key ->
                ParcelDetailScreen(
                    trackingId      = key.trackingId,
                    description     = key.description,
                    status          = key.status,
                    deliveryService = key.deliveryService,
                    lockerLabel     = key.lockerLabel.ifBlank { null },
                    otp             = key.otp.ifBlank { null },
                    arrivedAt       = key.arrivedAt,
                    onBack          = { backStack.removeLastOrNull() }
                )
            }

            // ── Manage Parcels (Admin) ───────────────────────────────────────
            entry<ManageParcels> {
                ManageParcelsScreen(onBack = { backStack.removeLastOrNull() })
            }

            // ── Verify Student Pickup (Admin) ─────────────────────────────
            entry<VerifyPickup> {
                VerifyPickupScreen(onBack = { backStack.removeLastOrNull() })
            }

            // ── Profile Settings ──────────────────────────────────────────
            entry<ProfileSettings> {
                ProfileSettingsScreen(onBack = { backStack.removeLastOrNull() })
            }

            // ── Locker Availability Map ──────────────────────────────────────
            entry<LockerMap> {
                LockerAvailabilityScreen(onBack = { backStack.removeLastOrNull() })
            }
        }
    )
}
