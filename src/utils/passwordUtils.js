import bcryptjs from "bcryptjs";

// Hash password
export const hashPassword = async (password) => {
  try {
    const saltRounds = 12;
    const hashedPassword = await bcryptjs.hash(password, saltRounds);
    return { success: true, hash: hashedPassword };
  } catch (error) {
    console.error("Password hashing error:", error);
    return { success: false, error: "Failed to hash password" };
  }
};

// Verify password
export const verifyPassword = async (password, hash) => {
  try {
    const isValid = await bcryptjs.compare(password, hash);
    return { success: true, isValid };
  } catch (error) {
    console.error("Password verification error:", error);
    return { success: false, error: "Failed to verify password" };
  }
};

// Generate random OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
