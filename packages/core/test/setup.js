// Polyfill for TextEncoder/TextDecoder in jsdom
import { ReadableStream } from "node:stream/web";
import { TextDecoder, TextEncoder } from "node:util";
import { MessagePort } from "node:worker_threads";

Object.assign(global, { MessagePort, ReadableStream, TextDecoder, TextEncoder });

// Mock browser API for tests
global.browser = {
  storage: {
    local: {
      get: () => Promise.resolve({}),
      set: () => Promise.resolve(),
    },
  },
};
