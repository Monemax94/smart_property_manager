// Utility to generate secure random password
export const generatePassword = () => {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Ensure compliance with pattern (has uppercase, lowercase, digit, special)
    if (!/[A-Z]/.test(password)) password += "A";
    if (!/[a-z]/.test(password)) password += "a";
    if (!/[0-9]/.test(password)) password += "1";
    if (!/[!@#$%^&*]/.test(password)) password += "@";

    return password;
}