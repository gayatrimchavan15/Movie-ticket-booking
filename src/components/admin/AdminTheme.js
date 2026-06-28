// Modern Professional Admin Theme
// Consistent styling across all admin pages

export const AdminTheme = {
  // Color Palette
  colors: {
    primary: "#667eea",
    primaryDark: "#764ba2",
    secondary: "#10B981",
    accent: "#F59E0B",
    danger: "#EF4444",
    warning: "#F59E0B",
    success: "#10B981",
    info: "#3B82F6",
    
    // Grays
    gray50: "#F9FAFB",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
    gray300: "#D1D5DB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    gray700: "#374151",
    gray800: "#1F2937",
    gray900: "#111827",
    
    // Background
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    cardBackground: "rgba(255, 255, 255, 0.95)",
    white: "#FFFFFF"
  },

  // Typography
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    
    // Headings
    h1: {
      fontSize: "2.5rem",
      fontWeight: "800",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      margin: "0 0 30px 0",
      letterSpacing: "-0.5px"
    },
    
    h2: {
      fontSize: "1.8rem",
      fontWeight: "700",
      color: "#1F2937",
      margin: "0 0 20px 0"
    },
    
    h3: {
      fontSize: "1.3rem",
      fontWeight: "700",
      color: "#1F2937",
      margin: "0 0 15px 0"
    },
    
    // Body text
    body: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
      lineHeight: "1.5"
    },
    
    // Small text
    small: {
      fontSize: "12px",
      fontWeight: "500",
      color: "#6B7280"
    }
  },

  // Layout Components
  layout: {
    // Main container
    container: {
      display: "flex",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    },
    
    // Content area
    content: {
      flex: 1,
      padding: "30px",
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(10px)",
      margin: "20px",
      marginLeft: "280px",
      borderRadius: "20px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      overflowY: "auto"
    }
  },

  // Card Components
  cards: {
    // Standard card
    card: {
      background: "white",
      borderRadius: "16px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      border: "1px solid rgba(255,255,255,0.2)",
      padding: "24px",
      marginBottom: "20px",
      transition: "all 0.3s ease"
    },
    
    // Stat card
    statCard: {
      background: "white",
      padding: "24px",
      borderRadius: "16px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      border: "1px solid rgba(255,255,255,0.2)",
      transition: "all 0.3s ease",
      cursor: "pointer",
      position: "relative",
      overflow: "hidden"
    }
  },

  // Button Components
  buttons: {
    // Primary button
    primary: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      padding: "12px 24px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    
    // Secondary button
    secondary: {
      background: "rgba(255, 255, 255, 0.8)",
      color: "#667eea",
      border: "2px solid rgba(102, 126, 234, 0.3)",
      borderRadius: "12px",
      padding: "10px 20px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    },
    
    // Danger button
    danger: {
      background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
      color: "white",
      border: "none",
      borderRadius: "8px",
      padding: "8px 16px",
      fontSize: "12px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    }
  },

  // Table Components
  table: {
    // Table container
    container: {
      background: "white",
      borderRadius: "16px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      padding: "30px",
      border: "1px solid rgba(255,255,255,0.2)",
      marginBottom: "30px"
    },
    
    // Table element
    table: {
      width: "100%",
      borderCollapse: "collapse",
      borderRadius: "12px",
      overflow: "hidden"
    },
    
    // Table header
    th: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      padding: "16px 12px",
      textAlign: "left",
      fontSize: "14px",
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    
    // Table cell
    td: {
      padding: "16px 12px",
      borderBottom: "1px solid #E5E7EB",
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
      transition: "background-color 0.2s ease"
    },
    
    // Empty state
    empty: {
      padding: "40px",
      textAlign: "center",
      fontSize: "16px",
      color: "#9CA3AF",
      fontWeight: "500",
      fontStyle: "italic"
    }
  },

  // Form Components
  forms: {
    // Input field
    input: {
      width: "100%",
      padding: "12px 16px",
      border: "2px solid #E5E7EB",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
      background: "white",
      transition: "all 0.2s ease",
      outline: "none"
    },
    
    // Select dropdown
    select: {
      padding: "10px 15px",
      border: "1px solid #E5E7EB",
      borderRadius: "8px",
      background: "white",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      outline: "none"
    },
    
    // Textarea
    textarea: {
      width: "100%",
      minHeight: "80px",
      padding: "12px 16px",
      border: "2px solid #E5E7EB",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
      background: "white",
      transition: "all 0.2s ease",
      outline: "none",
      resize: "vertical"
    }
  },

  // Utility Classes
  utils: {
    // Shadows
    shadow: {
      sm: "0 2px 8px rgba(0,0,0,0.1)",
      md: "0 4px 20px rgba(0,0,0,0.08)",
      lg: "0 8px 30px rgba(0,0,0,0.15)",
      xl: "0 20px 40px rgba(0,0,0,0.1)"
    },
    
    // Spacing
    spacing: {
      xs: "8px",
      sm: "12px",
      md: "16px",
      lg: "20px",
      xl: "24px",
      xxl: "30px"
    },
    
    // Border radius
    borderRadius: {
      sm: "8px",
      md: "12px",
      lg: "16px",
      xl: "20px"
    }
  },

  // Animation & Transitions
  animations: {
    // Hover effects
    cardHover: {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 30px rgba(0,0,0,0.15)"
    },
    
    // Button hover
    buttonHover: {
      transform: "translateY(-1px)",
      boxShadow: "0 6px 20px rgba(102, 126, 234, 0.6)"
    },
    
    // Transitions
    transition: {
      fast: "all 0.2s ease",
      normal: "all 0.3s ease",
      slow: "all 0.5s ease"
    }
  }
};

// Helper function to merge theme styles with custom styles
export const mergeStyles = (themeStyle, customStyle = {}) => {
  return { ...themeStyle, ...customStyle };
};

// Helper function to create gradient text
export const gradientText = (text) => ({
  background: AdminTheme.colors.background,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent"
});

export default AdminTheme;
