import { WebClient } from '@slack/web-api';

export class SlackClient extends WebClient {
  constructor(token: string) {
    super(token);
  }
}
