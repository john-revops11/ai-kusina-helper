
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
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Save user role in database
    await set(ref(database, `users/${user.uid}/role`), role);
    
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// Sign in user
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

// Sign out user
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Get current user with role
export const getCurrentUser = async (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      
      if (user) {
        // Get user role from database
        try {
          const roleSnapshot = await get(ref(database, `users/${user.uid}/role`));
          const role = roleSnapshot.exists() ? roleSnapshot.val() as UserRole : "user";
          
          const userWithRole = user as User;
          userWithRole.role = role;
          
          resolve(userWithRole);
        } catch (error) {
          console.error("Error getting user role:", error);
          resolve(user as User);
        }
      } else {
        resolve(null);
      }
    });
  });
};

// Initialize users
export const initializeUsers = async () => {
  try {
    // Check if users already exist to prevent duplication
    const adminEmail = "admin@example.com";
    const userEmail = "user@example.com";
    const password = "password123";
    
    try {
      // Try to sign in as admin to check if it exists
      await loginUser(adminEmail, password);
      console.log("Admin user already exists");
    } catch (error) {
      // Admin doesn't exist, create it
      await registerUser(adminEmail, password, "admin");
      console.log("Admin user created");
    }
    
    try {
      // Try to sign in as user to check if it exists
      await loginUser(userEmail, password);
      console.log("Regular user already exists");
    } catch (error) {
      // User doesn't exist, create it
      await registerUser(userEmail, password, "user");
      console.log("Regular user created");
    }
    
  } catch (error) {
    console.error("Error initializing users:", error);
  }
};
