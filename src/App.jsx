
// ✅ FIXED VERSION (JSX + TYPESCRIPT CLEAN, NO HTML ENTITIES)
import React, { useState, useEffect, useCallback, useRef } from "react";


/* ================= DESIGN TOKENS ================= */
const colors = {
  primary: '#007bff',
  secondary: '#6c757d',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
  light: '#f8f9fa',
  dark: '#343a40',
  white: '#ffffff',
  black: '#000000'
};

const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px'
};

const typography = {
  fontFamily: 'Arial, sans-serif',
  fontSize: {
    sm: '12px',
    md: '16px',
    lg: '20px'
  },
  fontWeight: {
    regular: 400,
    bold: 700
  }
};
/* ================= TYPES ================= */
interface ExampleComponentProps {
  initialCount?: number;
  message?: string;
}

/* ================= COMPONENT ================= */
const ExampleComponent: React.FC<ExampleComponentProps> = ({
  initialCount = 0,
  message = 'Default Message'
}) => {
  const [count, setCount] = useState<number>(initialCount);
  const [text, setText] = useState<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // ✅ Timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCount(prev => prev + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
  // ✅ Input handler
  const handleTextChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
  }, []);
  // ✅ Reset
  const resetCount = useCallback(() => {
    setCount(initialCount);
  }, [initialCount]);
  return (
    <div style={{ fontFamily: typography.fontFamily, padding: spacing.md }}>
      <h1 style={{ color: colors.primary, fontSize: typography.fontSize.lg }}>
        {message}
      </h1>
      <p style={{ fontSize: typography.fontSize.md }}>
        Current Count: <span style={{ fontWeight: typography.fontWeight.bold }}>{count}</span>
      </p>
      <input
        type="text"
        value={text}
        onChange={handleTextChange}
        placeholder="Type something..."
        style={{
          margin: `${spacing.sm} 0`,
          padding: spacing.sm,
          fontSize: typography.fontSize.md
        }}
      />
      <p style={{ marginTop: spacing.sm }}>
        Entered Text: {text}
      </p>

      <button        onClick={resetCount}
        style={{
          backgroundColor: colors.secondary,
          color: colors.white,
          padding: spacing.sm,
          border: 'none',
          cursor: 'pointer',
          fontSize: typography.fontSize.md
        }}
      >
        Reset Count
      </button>
    </div>
  );
};

export default ExampleComponent;
