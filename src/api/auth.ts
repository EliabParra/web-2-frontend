import { post } from "./client";

export interface SessionUser {
  user_id: number;
  user_na: string;
  user_em: string;
  profile_ids: number[];
}

interface LoginResponse {
  status: string;
  user: SessionUser;
  msg: { code: number; msg: string };
}

export async function login(identifier: string, password: string): Promise<SessionUser> {
  const { user } = await post<LoginResponse>("/login", { identifier, password });
  // The backend row also carries the password hash; keep only what the UI needs.
  return {
    user_id: user.user_id,
    user_na: user.user_na,
    user_em: user.user_em,
    profile_ids: user.profile_ids ?? [],
  };
}

export async function logout(): Promise<void> {
  await post("/logout");
}
