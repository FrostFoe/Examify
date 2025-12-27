import { User } from "./types";

/**
 * Creates a temporary guest user object without storing it in the database
 * This allows guest users to take exams without creating permanent accounts
 */
export function createTemporaryGuestUser(name: string, roll: string): User {
  // Create a temporary UID for the session (not stored in database)
  const tempUid = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    uid: tempUid,
    name: name,
    roll: roll,
    enrolled_batches: [],
    created_at: new Date().toISOString(),
  };
}

/**
 * Checks if a user is a temporary guest user
 */
export function isTemporaryGuestUser(user: User | null): boolean {
  return user?.uid.startsWith("guest_") || false;
}

/**
 * Gets guest user data from session storage
 */
export function getGuestUserFromSession(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  const savedGuest = sessionStorage.getItem("guest_user");
  if (savedGuest) {
    try {
      return JSON.parse(savedGuest);
    } catch (e) {
      console.error("Failed to parse guest session", e);
      return null;
    }
  }
  return null;
}

/**
 * Saves guest user data to session storage
 */
export function saveGuestUserToSession(user: User): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("guest_user", JSON.stringify(user));
  }
}

/**
 * Clears guest user session data
 */
export function clearGuestUserSession(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("guest_user");
  }
}
