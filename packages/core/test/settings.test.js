import { readFileSync } from "node:fs";
import { jest } from "@jest/globals";

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

test("loads and saves checkbox options as booleans", async () => {
  document.documentElement.innerHTML = readFileSync(
    new URL("../src/settings/settings.html", import.meta.url),
    "utf8",
  );
  const form = document.querySelector("form");
  for (const name of [
    "headingStyle",
    "bulletListMarker",
    "codeBlockStyle",
    "fence",
    "emDelimiter",
    "strongDelimiter",
    "linkStyle",
    "linkReferenceStyle",
  ]) {
    Object.defineProperty(form, name, {
      value: form.elements.namedItem(name),
    });
  }

  const set = jest.fn(() => Promise.resolve());
  browser.storage.local.get = jest.fn(() =>
    Promise.resolve({
      reduceListItemPadding: true,
      replaceAngleBrackets: false,
    }),
  );
  browser.storage.local.set = set;
  browser.permissions = {
    remove: jest.fn(() => Promise.resolve()),
    request: jest.fn(() => Promise.resolve(true)),
  };

  await import("../src/settings/settings.js");
  document.dispatchEvent(new Event("DOMContentLoaded"));
  await flushPromises();

  expect(document.querySelector("#reduceListItemPadding").checked).toBe(true);
  expect(document.querySelector("#replaceAngleBrackets").checked).toBe(false);

  document.querySelector("#reduceListItemPadding").checked = false;
  document.querySelector("#replaceAngleBrackets").checked = true;
  document
    .querySelector("form")
    .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  await flushPromises();

  expect(set).toHaveBeenCalledWith(
    expect.objectContaining({
      reduceListItemPadding: false,
      replaceAngleBrackets: true,
    }),
  );
});
