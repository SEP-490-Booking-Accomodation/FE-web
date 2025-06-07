import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Checks if a user exists in the profiles table
 * @param {string} userId - The ID of the user to check
 * @returns {Promise<Object>} Result of the check
 */
export const checkUserExistInSupabase = async (userId) => {
  try {
    if (!userId) {
      return {
        success: false,
        message: "User ID is required",
        exists: false,
      }
    }

    // Check if user exists in the profiles table
    const { data: profile, error } = await supabase.from("profiles").select("*").eq("iduserplatform", userId).single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error
      console.error("Error checking user existence:", error)
      return {
        success: false,
        message: `Error checking user: ${error.message}`,
        exists: false,
        error,
      }
    }

    return {
      success: true,
      exists: !!profile,
      profile: profile || null,
      message: profile ? "User exists" : "User not found",
    }
  } catch (error) {
    console.error("Error in checkUserExistInSupabase:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error.message}`,
      exists: false,
      error,
    }
  }
}

/**
 * Creates a new user profile in Supabase
 * @param {Object} profileData - Profile data to insert
 * @returns {Promise<Object>} Result of the operation
 */
export const createUserProfile = async (profileData) => {
  try {
    const { data, error } = await supabase.from("profiles").insert([profileData]).select().single()

    if (error) {
      console.error("Error creating user profile:", error)
      return {
        success: false,
        message: `Error creating profile: ${error.message}`,
        error,
      }
    }

    return {
      success: true,
      message: "User profile created successfully",
      profile: data,
    }
  } catch (error) {
    console.error("Error in createUserProfile:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error.message}`,
      error,
    }
  }
}

/**
 * Creates or gets an existing user profile
 * @param {Object} userData - User data from your main platform
 * @param {string} userData.userId - User ID from main platform
 * @param {string} userData.username - Username
 * @param {string} userData.roleName - Role name from main platform
 * @returns {Promise<Object>} Result of the operation
 */
export const createOrGetUserProfile = async (userData) => {
  try {
    // First check if user exists
    const existingUser = await checkUserExistInSupabase(userData.userId)

    if (existingUser.exists) {
      return {
        success: true,
        message: "User already exists",
        profile: existingUser.profile,
        isNew: false,
      }
    }

    // If user doesn't exist, create a new profile
    const profileData = {
      username: userData.username,
      iduserplatform: userData.userId,
      is_online: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      role: userData.roleName === "owner" ? 1 : 0,
    }

    const createResult = await createUserProfile(profileData)

    if (createResult.success) {
      return {
        success: true,
        message: "User profile created successfully",
        profile: createResult.profile,
        isNew: true,
      }
    } else {
      return createResult
    }
  } catch (error) {
    console.error("Error in createOrGetUserProfile:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error.message}`,
      error,
    }
  }
}

/**
 * Updates a user's profile in Supabase
 * @param {string} userId - The ID of the user to update
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object>} Result of the operation
 */
export const updateUserProfileInSupabase = async (userId, updateData) => {
  try {
    if (!userId) {
      return {
        success: false,
        message: "User ID is required",
      };
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("iduserplatform", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating user profile:", error);
      return {
        success: false,
        message: `Error updating profile: ${error.message}`,
        error,
      };
    }

    return {
      success: true,
      message: "User profile updated successfully",
      profile: data,
    };
  } catch (error) {
    console.error("Error in updateUserProfileInSupabase:", error);
    return {
      success: false,
      message: `An unexpected error occurred: ${error.message}`,
      error,
    };
  }
};
