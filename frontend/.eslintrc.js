module.exports = {
  extends: ["next/core-web-vitals", "prettier"],
  plugins: ["import", "jsx-a11y"],
  rules: {
    "no-console": "warn",
    "react/prop-types": "off",
    "jsx-a11y/anchor-is-valid": "off",
    "react/no-unescaped-entities": "off",
    "import/no-anonymous-default-export": "off",
    "react/display-name": "off",
    "react/jsx-key": "warn",
    "react-hooks/exhaustive-deps": "warn",
  },
};
