import { convertTitleSubstitution } from "../src/utils/title-substitution";
import { imgToDataUrl, resolveRelativeUrls } from "../src/utils/url-resolver";

describe("util", () => {
  describe("convertTitleSubstitution", () => {
    test.each`
      title                  | substitutionOption           | result
      ${"abcd"}              | ${"cd"}                      | ${"ab"}
      ${"/\\^%[]hello"}      | ${"/\\^%[]"}                 | ${"hello"}
      ${"second line title"} | ${"first line\nsecond line"} | ${" title"}
    `(
      "provides string title substitution on $title",
      ({ title, substitutionOption, result }) => {
        expect(
          title.replace(convertTitleSubstitution(substitutionOption), "")
        ).toBe(result);
      }
    );

    test.each`
      title                  | substitutionOption       | result
      ${"abcd"}              | ${"/[abc]+/"}            | ${"d"}
      ${"title #1234"}       | ${"/ #\\d+/"}            | ${"title"}
      ${"second line title"} | ${"first line\n/[^l]+/"} | ${"ll"}
    `(
      "provides regex title substitution on $title",
      ({ title, substitutionOption, result }) => {
        expect(
          title.replace(convertTitleSubstitution(substitutionOption), "")
        ).toBe(result);
      }
    );
  });

  describe("resolveRelativeUrls", () => {
    test("resolves relative links and image sources against the page URL", () => {
      const container = document.createElement("div");
      container.innerHTML = `
        <a href="../guide">Guide</a>
        <a href="https://example.net/absolute">Absolute</a>
        <img src="images/example.png">
      `;

      resolveRelativeUrls(container, "https://example.com/docs/page.html");

      expect(container.querySelectorAll("a")[0].getAttribute("href")).toBe(
        "https://example.com/guide"
      );
      expect(container.querySelectorAll("a")[1].getAttribute("href")).toBe(
        "https://example.net/absolute"
      );
      expect(container.querySelector("img").getAttribute("src")).toBe(
        "https://example.com/docs/images/example.png"
      );
    });
  });

  describe("imgToDataUrl", () => {
    test("keeps the original URL when the image cannot be loaded", async () => {
      const OriginalImage = global.Image;
      global.Image = class {
        setAttribute() {}

        set src(_value) {
          this.onerror();
        }
      };
      const image = document.createElement("img");
      image.src = "https://example.com/cross-origin.png";

      try {
        await expect(imgToDataUrl(image)).resolves.toBe(image.src);
      } finally {
        global.Image = OriginalImage;
      }
    });
  });
});
