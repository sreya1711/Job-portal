import { http } from './http';

export async function login(credentials) {
  const res = await http.post('/api/auth/login', credentials);
  return res; // { user, token }
}

export async function register(data) {
  const res = await http.post('/api/auth/signup', data);
  return res; // { user, token }
}

export async function logout() {
  return true;
}