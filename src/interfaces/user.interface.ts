export interface UserAuthorizedRequest {
  user: {
    user_id: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
}
