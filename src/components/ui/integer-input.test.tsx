import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { IntegerInput } from "./integer-input";

const Harness = () => {
  const [value, setValue] = useState("");
  return <IntegerInput aria-label="code" value={value} onChange={(e) => setValue(e.target.value)} />;
};

describe("IntegerInput", () => {
  it("keeps digits and ignores any other character", () => {
    render(<Harness />);
    const input = screen.getByLabelText("code") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "12" } });
    expect(input.value).toBe("12");

    fireEvent.change(input, { target: { value: "12fd" } });
    expect(input.value).toBe("12");

    fireEvent.change(input, { target: { value: "" } });
    expect(input.value).toBe("");
  });

  it("opens the numeric keyboard on mobile", () => {
    render(<Harness />);
    expect(screen.getByLabelText("code")).toHaveAttribute("inputmode", "numeric");
  });
});
