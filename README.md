# passport-nostr

A **Passport.js authentication strategy** for **Nostr**, using signed events for secure authentication.

## Features

- Uses **Nostr events** for authentication.
- Ensures valid **signatures** using `nostr-tools`.
- Validates **timestamp, kind, method, and URL**.
- Supports `passReqToCallback` for additional flexibility.

## Installation

Install the package and its dependencies:

```sh
npm install passport-nostr
```

## Usage

### Express.js Integration

#### 1️⃣ **Configure the Strategy**

```typescript
import passport from "passport";
import { NostrStrategy } from "passport-nostr";

passport.use(
  new NostrStrategy({}, (pubkey, done) => {
    // Find or create user by pubkey
    const user = { pubkey };
    return done(null, user);
  })
);
```

#### 2️⃣ **Apply to Express Routes**

```typescript
import express from "express";

const app = express();

app.use(passport.initialize());

app.post("/protected", passport.authenticate("nostr", { session: false }), (req, res) => {
  res.json({ message: "Authenticated!", user: req.user });
});
```

### NestJS Integration

#### 1️⃣ **Install Passport Module**

```sh
npm install @nestjs/passport
```

#### 2️⃣ **Create a Nostr Auth Guard**

```typescript
import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class NostrAuthGuard extends AuthGuard("nostr") {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
```

#### 3️⃣ **Use in a Controller**

```typescript
import { Controller, Get, UseGuards, Request } from "@nestjs/common";
import { NostrAuthGuard } from "./nostr-auth.guard";

@Controller("protected")
export class ProtectedController {
  @Get()
  @UseGuards(NostrAuthGuard)
  getProtected(@Request() req) {
    return { message: "Authenticated!", user: req.user };
  }
}
```

## Sending an Authentication Request

A client must send a **signed Nostr event** in the `Authorization` header.

```http
POST /protected HTTP/1.1
Authorization: Nostr eyJwdWJrZXkiOiAicHVibGljS2V5IiwgImNyZWF0ZWRfYXQiOiAxNzAwMDAwMDAwLCAiZ2V0cyI6IFtbInVybCIsICJodHRwOi8vbG9jYWxob3N0L3Byb3RlY3RlZCJdLCBbIm1ldGhvZCIsICJQT1NUIl1dfQ==
```

## Strategy Behavior

1. Extracts the `Authorization` header.
2. Decodes the Nostr event.
3. Validates:
   - **Signature** using `nostr-tools.verifyEvent()`
   - **Kind** (must be `27235`)
   - **Timestamp** (must be within ±5 minutes)
   - **Method & URL** tags
4. Calls the **verify callback** with the `pubkey`.

## Options

| Option              | Type    | Default          | Description                                    |
| ------------------- | ------- | ---------------- | ---------------------------------------------- |
| `passReqToCallback` | boolean | `false`          | If `true`, passes `req` to the verify function |
| `timeToleranceMs`   | number  | `300000` (5 min) | Adjusts the allowed timestamp difference       |

## Running Tests

<!-- TODO -->

## License

Apache
