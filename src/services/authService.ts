import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { database } from "./firebase";

// User roles
export type UserRole = "user" | "admin";

// User type with role
export interface User extends FirebaseUser {
  role?: UserRole;
}

const auth = getAuth();

// Create a new user
export const registerUser = async (email: string, password: string, role: UserRole = "user") => {
  try {
    console.log(`Attempting to register user: ${email} with role: ${role}`);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log(`User registered successfully: ${user.uid}`);
    
    // Save user role in database
    await set(ref(database, `users/${user.uid}/role`), role);
    console.log(`Role saved for user: ${user.uid}`);
    
    return user;
  } catch (error: any) {
    console.error(`Error creating user: ${email}`, error);
    console.error(`Error code: ${error.code}, message: ${error.message}`);
    throw error;
  }
};

// Sign in user
export const loginUser = async (email: string, password: string) => {
  try {
    console.log(`Attempting to sign in user: ${email}`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log(`User signed in successfully: ${userCredential.user.uid}`);
    return userCredential.user;
  } catch (error: any) {
    console.error(`Error signing in: ${email}`, error);
    console.error(`Error code: ${error.code}, message: ${error.message}`);
    throw error;
  }
};

// Sign out user
export const logoutUser = async () => {
  try {
    console.log("Attempting to sign out user");
    await signOut(auth);
    console.log("User signed out successfully");
  } catch (error: any) {
    console.error("Error signing out:", error);
    console.error(`Error code: ${error.code}, message: ${error.message}`);
    throw error;
  }
};

// Get current user with role
export const getCurrentUser = async (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      
      if (user) {
        console.log(`Current user detected: ${user.uid}, email: ${user.email}`);
        // Get user role from database
        try {
          const roleSnapshot = await get(ref(database, `users/${user.uid}/role`));
          const role = roleSnapshot.exists() ? roleSnapshot.val() as UserRole : "user";
          
          console.log(`Role for user ${user.uid}: ${role}`);
          
          const userWithRole = user as User;
          userWithRole.role = role;
          
          resolve(userWithRole);
        } catch (error) {
          console.error(`Error getting user role for ${user.uid}:`, error);
          resolve(user as User);
        }
      } else {
        console.log("No current user detected");
        resolve(null);
      }
    });
  });
};

// Initialize users
export const initializeUsers = async () => {
  try {
    console.log("Initializing demo users");
    // Check if users already exist to prevent duplication
    const adminEmail = "admin@example.com";
    const userEmail = "user@example.com";
    const password = "password123";
    
    try {
      // Try to sign in as admin to check if it exists
      console.log("Checking if admin user exists");
      await loginUser(adminEmail, password);
      console.log("Admin user already exists");
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Admin doesn't exist, create it
        console.log("Admin user doesn't exist, creating it");
        await registerUser(adminEmail, password, "admin");
        console.log("Admin user created");
      } else {
        // Other error
        console.error("Error checking admin user:", error);
        throw error;
      }
    }
    
    try {
      // Try to sign in as user to check if it exists
      console.log("Checking if regular user exists");
      await loginUser(userEmail, password);
      console.log("Regular user already exists");
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist, create it
        console.log("Regular user doesn't exist, creating it");
        await registerUser(userEmail, password, "user");
        console.log("Regular user created");
      } else {
        // Other error
        console.error("Error checking regular user:", error);
        throw error;
      }
    }
    
    console.log("User initialization complete");
  } catch (error) {
    console.error("Error initializing users:", error);
    throw error;
  }
};
