export interface AuthResponse {
    token?: string;
    accessToken?: string;
    expiresIn?: number;
    // ...other fields (user info)
}
