import { render, screen } from "@testing-library/react";
import { ScoreRing } from "./ScoreRing";

describe("ScoreRing", () => {
  it("renders the value and label", () => {
    render(<ScoreRing value={82} label="Promedio" />);
    expect(screen.getByText("82")).toBeInTheDocument();
    expect(screen.getByText("Promedio")).toBeInTheDocument();
  });
});
