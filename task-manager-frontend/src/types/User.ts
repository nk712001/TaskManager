export interface User {
  id: string;         // Email is being used as ID
  userId?: number;    // Numeric user ID for backend
  username: string;
  email: string;
}
