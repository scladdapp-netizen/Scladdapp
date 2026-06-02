import emailjs from "emailjs-com";

// Initialize EmailJS
emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

export const sendOTPEmail = async (email, otp, schoolName) => {
  try {
    const templateParams = {
      to_email: email, // This will now work!
      name: schoolName, // This matches {{name}} in template
      email: "Scladapp2562003@gmail.com", // This matches {{email}} in template
      message: `Your OTP code is: ${otp}`, // This matches {{message}} in template
      title: "OTP Verification", // This matches {{title}} in template
    };

    const response = await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      templateParams
    );

    return { success: true, data: response };
  } catch (error) {
    console.error("EmailJS Error:", error);
    return { success: false, error: error.message };
  }
};

export const sendWelcomeEmail = async (email, schoolName, adminUsername) => {
  try {
    const templateParams = {
      to_email: email, // This will now work!
      name: schoolName, // This matches {{name}} in template
      email: "Scladapp2562003@gmail.com", // This matches {{email}} in template
      message: `welcommm`, // This matches {{message}} in template
      title: "welcomm", // This matches {{title}} in template
    };

    const response = await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      templateParams
    );

    return { success: true, data: response };
  } catch (error) {
    console.error("Welcome email error:", error);
    return { success: false, error: error.message };
  }
};
