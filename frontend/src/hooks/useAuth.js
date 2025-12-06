// Delegate to the central AuthContext to ensure a single source of truth
import { useAuth as useAuthContext } from '../contexts/AuthContext';

export function useAuth() {
  return useAuthContext();
}