import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "next-themes";
import { describe, expect, it } from "vitest";

import { ThemeToggle } from "@/components/theme-toggle";

function renderWithTheme() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe("ThemeToggle", () => {
  it("muestra un botón accesible para cambiar el tema", () => {
    renderWithTheme();
    expect(screen.getByRole("button", { name: /cambiar tema/i })).toBeInTheDocument();
  });

  it("despliega las opciones claro, oscuro y sistema", async () => {
    const user = userEvent.setup();
    renderWithTheme();

    await user.click(screen.getByRole("button", { name: /cambiar tema/i }));

    expect(await screen.findByRole("menuitem", { name: /claro/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /oscuro/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /sistema/i })).toBeInTheDocument();
  });
});
