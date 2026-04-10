export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
export declare const sendEmail: (options: EmailOptions) => Promise<boolean>;
export declare const sendPasswordResetEmail: (email: string, resetToken: string, userName: string) => Promise<boolean>;
//# sourceMappingURL=email.d.ts.map