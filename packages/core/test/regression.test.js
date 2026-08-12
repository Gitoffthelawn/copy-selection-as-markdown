import { readdirSync, readFileSync } from "fs";
import { join, extname, sep, dirname } from "path";
import { fileURLToPath } from "url";
import { JSDOM, VirtualConsole } from "jsdom";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import TurndownService from "turndown";
import turndownPluginMathJax from "../src/plugins/mathjax";

const turndownService = TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-"
});
turndownService.use(turndownPluginMathJax);

const testCases = readdirSync(join(__dirname, sep, "commonmark"));
const virtualConsole = new VirtualConsole();
virtualConsole.forwardTo(console, { jsdomErrors: "none" });
virtualConsole.on("jsdomError", (error) => {
  if (error.type !== "css-parsing") {
    console.error(error);
  }
});

testCases.forEach(testCase => {
  if (extname(testCase) === ".html") {
    test(`${testCase}`, () => {
      const input = new JSDOM(
        readFileSync(`${__dirname}/commonmark/${testCase}`, "utf-8"),
        { virtualConsole },
      ).window.document;
      expect(turndownService.turndown(input)).toMatchSnapshot();
    });
  }
});
