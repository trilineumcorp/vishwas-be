export interface TokenPayload {
    id: string;
    email: string;
    role: 'admin' | 'student';
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export declare const generateTokens: (payload: TokenPayload) => TokenPair;
export declare const verifyAccessToken: (token: string) => TokenPayload | null;
export declare const verifyRefreshToken: (token: string) => TokenPayload | null;
//# sourceMappingURL=jwt.d.ts.map