const themeStorageKey = "preachselah-theme";
const availableThemes = ["light", "dark", "sage"];
let savedTheme = "light";
let themeStorageUnavailable = false;

try {
  const storedTheme = localStorage.getItem(themeStorageKey);
  if (availableThemes.includes(storedTheme)) savedTheme = storedTheme;
} catch {
  themeStorageUnavailable = true;
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.content = theme === "dark" ? "#181d19" : theme === "sage" ? "#edf3ed" : "#f7f6f2";
  }
}

applyTheme(savedTheme);

document.addEventListener("DOMContentLoaded", () => {
  const selector = document.getElementById("theme-select");
  const status = document.getElementById("theme-status");
  if (!selector) return;

  selector.value = savedTheme;
  if (themeStorageUnavailable && status) {
    status.textContent = "Could not load your saved theme. Using the light theme.";
  }

  selector.addEventListener("change", () => {
    const theme = availableThemes.includes(selector.value) ? selector.value : "light";
    applyTheme(theme);

    try {
      localStorage.setItem(themeStorageKey, theme);
      if (status) status.textContent = "";
    } catch {
      if (status) {
        status.textContent = "Theme changed for this page, but your preference could not be saved.";
      }
    }
  });
});
