import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, useTheme } from "./ThemeProvider";

function Probe() {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>theme:{theme}</button>;
}

describe("ThemeProvider", () => {
  it("defaults to light and toggles to dark, persisting and setting the class", () => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    render(<ThemeProvider><Probe /></ThemeProvider>);
    expect(screen.getByText("theme:light")).toBeInTheDocument();
    fireEvent.click(screen.getByText("theme:light"));
    expect(screen.getByText("theme:dark")).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("interviewai-theme")).toBe("dark");
  });
});
