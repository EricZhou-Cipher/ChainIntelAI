declare namespace jest {
  interface Matchers<R> {
    toBeWithinRange(floor: number, ceiling: number): R;
  }
}

declare module '@slack/web-api' {
  export class WebClient {
    constructor(token?: string);
    chat: {
      postMessage: (options: { channel: string; text: string }) => Promise<{ ok: boolean }>;
    };
  }
}
