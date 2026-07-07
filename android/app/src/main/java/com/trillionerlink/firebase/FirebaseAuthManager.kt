package com.trillionerlink.firebase

import android.content.Context
import android.util.Log
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import kotlinx.coroutines.tasks.await

/**
 * Firebase Authentication Manager for Android
 * Handles Google Sign-In and Firebase Auth operations
 */
class FirebaseAuthManager(private val context: Context) {
    
    private val firebaseAuth = FirebaseAuth.getInstance()
    private val googleSignInClient: GoogleSignInClient
    
    companion object {
        private const val TAG = "FirebaseAuthManager"
        private const val WEB_CLIENT_ID = "364286702954-sckjhqv39j5cc4t0eoeruchn679audm4.apps.googleusercontent.com"
    }
    
    init {
        // Configure Google Sign-In
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(WEB_CLIENT_ID)
            .requestEmail()
            .requestProfile()
            .build()
        
        googleSignInClient = GoogleSignIn.getClient(context, gso)
    }
    
    /**
     * Get current user
     */
    fun getCurrentUser() = firebaseAuth.currentUser
    
    /**
     * Check if user is logged in
     */
    fun isUserLoggedIn(): Boolean = firebaseAuth.currentUser != null
    
    /**
     * Sign in with Google ID Token
     */
    suspend fun signInWithGoogle(idToken: String): Result<String> {
        return try {
            val credential = GoogleAuthProvider.getCredential(idToken, null)
            val authResult = firebaseAuth.signInWithCredential(credential).await()
            
            val user = authResult.user
            if (user != null) {
                Log.d(TAG, "Sign in successful: ${user.email}")
                Result.success(user.uid)
            } else {
                Result.failure(Exception("User is null after sign in"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Sign in failed", e)
            Result.failure(e)
        }
    }
    
    /**
     * Sign out
     */
    suspend fun signOut(): Result<Unit> {
        return try {
            firebaseAuth.signOut()
            googleSignInClient.signOut().await()
            Log.d(TAG, "Sign out successful")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Sign out failed", e)
            Result.failure(e)
        }
    }
    
    /**
     * Get ID Token
     */
    suspend fun getIdToken(): Result<String> {
        return try {
            val user = firebaseAuth.currentUser
            if (user != null) {
                val tokenResult = user.getIdToken(false).await()
                val token = tokenResult.token
                if (token != null) {
                    Result.success(token)
                } else {
                    Result.failure(Exception("Token is null"))
                }
            } else {
                Result.failure(Exception("User not authenticated"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get ID token", e)
            Result.failure(e)
        }
    }
    
    /**
     * Update user profile
     */
    suspend fun updateUserProfile(displayName: String?, photoUrl: String?): Result<Unit> {
        return try {
            val user = firebaseAuth.currentUser
            if (user != null) {
                val profileUpdates = com.google.firebase.auth.UserProfileChangeRequest.Builder()
                    .setDisplayName(displayName)
                    .setPhotoUri(photoUrl?.let { android.net.Uri.parse(it) })
                    .build()
                
                user.updateProfile(profileUpdates).await()
                Log.d(TAG, "Profile updated successfully")
                Result.success(Unit)
            } else {
                Result.failure(Exception("User not authenticated"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to update profile", e)
            Result.failure(e)
        }
    }
    
    /**
     * Delete user account
     */
    suspend fun deleteUser(): Result<Unit> {
        return try {
            val user = firebaseAuth.currentUser
            if (user != null) {
                user.delete().await()
                Log.d(TAG, "User deleted successfully")
                Result.success(Unit)
            } else {
                Result.failure(Exception("User not authenticated"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to delete user", e)
            Result.failure(e)
        }
    }
    
    /**
     * Send password reset email
     */
    suspend fun sendPasswordResetEmail(email: String): Result<Unit> {
        return try {
            firebaseAuth.sendPasswordResetEmail(email).await()
            Log.d(TAG, "Password reset email sent to $email")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send password reset email", e)
            Result.failure(e)
        }
    }
    
    /**
     * Get user email
     */
    fun getUserEmail(): String? = firebaseAuth.currentUser?.email
    
    /**
     * Get user display name
     */
    fun getUserDisplayName(): String? = firebaseAuth.currentUser?.displayName
    
    /**
     * Get user photo URL
     */
    fun getUserPhotoUrl(): String? = firebaseAuth.currentUser?.photoUrl?.toString()
    
    /**
     * Get user UID
     */
    fun getUserUid(): String? = firebaseAuth.currentUser?.uid
}
