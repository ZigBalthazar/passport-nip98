import { Strategy } from "passport-strategy";
import { Request } from "express";
import { Event, verifyEvent } from "nostr-tools";

export type NostrStrategyOptions = {
  passReqToCallback?: boolean;
  timeToleranceMs?: number;
};

export class NostrStrategy extends Strategy {
  public Scheme = "Nostr";
  constructor(private options: NostrStrategyOptions, private verify: Function) {
    super();
  }

  authenticate(req: unknown) {
    const request = req as Request;
    const authHeader = request.headers["authorization"];

    if (!authHeader) {
      return this.fail({ message: "Missing Authorization header" }, 401);
    }

    if (!authHeader.startsWith(`${this.Scheme} `)) {
      return this.fail({ message: "Invalid authorization scheme" }, 400);
    }

    const token = authHeader.slice(5).trim();

    const bToken = Buffer.from(token, "base64").toString("utf-8");

    if (!bToken || !bToken.startsWith("{")) {
      return this.fail({ message: "Malformed token" }, 400);
    }

    let ev: Event;
    try {
      ev = JSON.parse(bToken) as Event;
    } catch {
      return this.fail({ message: "Invalid JSON format" }, 400);
    }

    const isValidEvent = verifyEvent(ev);
    if (!isValidEvent) {
      return this.fail({ message: "Invalid Nostr event signature" }, 401);
    }

    if (ev.kind != 27_235) {
      return this.fail({ message: "Invalid Nostr event, wrong kind" }, 401);
    }

    const allowedTimeDiff = this.options.timeToleranceMs ?? 5 * 60 * 1000;

    const now = Date.now();
    const diffTime = Math.abs(ev.created_at * 1000 - now);
    if (diffTime > allowedTimeDiff) {
      return this.fail({ message: "Invalid Nostr event, timestamp out of range" }, 401);
    }

    const urlTag = ev.tags.find((tag) => tag[0] === "url")?.[1];
    const methodTag = ev.tags.find((tag) => tag[0] === "method")?.[1];

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlTag);
    } catch {
      return this.fail({ message: "Malformed URL tag" }, 400);
    }

    if (parsedUrl.pathname !== request.path) {
      return this.fail({ message: "URL tag does not match request path" }, 401);
    }

    if (!methodTag || methodTag.toLowerCase() !== request.method.toLowerCase()) {
      return this.fail({ message: "Method tag does not match request method" }, 401);
    }

    const verified = (error?: any, user?: any) => {
      if (error) return this.error(error);
      this.success(user ?? { pubkey: ev.pubkey });
    };

    try {
      if (this.options.passReqToCallback) {
        this.verify(request, verified);
      } else {
        this.verify(ev.pubkey, verified);
      }
    } catch (ex) {
      return this.error(ex);
    }
  }
}
