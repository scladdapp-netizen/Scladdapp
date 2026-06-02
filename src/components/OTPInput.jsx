import { useRef } from "react";
import "./OTPInput.css";

export default function OTPInput({ value, onChange, hasError }) {
  const inputs = useRef([]);

  const handleChange = (val, index) => {
    const updated = [...value];
    updated[index] = val.slice(-1);
    onChange(updated);
    if (val && index < value.length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").slice(0, value.length).split("");
    const updated = [...value];
    pasted.forEach((char, i) => { updated[i] = char; });
    onChange(updated);
    const nextEmpty = updated.findIndex(d => !d);
    const focusIdx = nextEmpty === -1 ? value.length - 1 : nextEmpty;
    inputs.current[focusIdx]?.focus();
  };

  return (
    <div className="otp-input-row">
      {value.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          className={`otp-box${hasError ? " otp-box-error" : ""}${digit ? " otp-box-filled" : ""}`}
          value={digit}
          onChange={(e) => handleChange(e.target.value, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          maxLength={1}
          inputMode="numeric"
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}
