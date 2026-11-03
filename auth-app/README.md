# Auth App – Node.js + Express + MongoDB login system

Username/password authentication with bcrypt-hashed passwords and session-based login.

## Features

- Register and log in with a username and password
- Passwords hashed with bcrypt (12 salt rounds), never stored in plain text
- Mongoose `User` model, sessions stored in MongoDB (`connect-mongo`)
- Clear error messages: invalid username, incorrect password, missing fields, duplicate username, etc.
- Protected `/dashboard` page, shown after a successful login
- Logout that destroys the session and clears the cookie
- Session ID regenerated on login (protects against session fixation)

## Folder structure

```
auth-app/
├── server.js               # App entry: Express, sessions, MongoDB connection
├── package.json
├── .env.example            # Copy to .env
├── .gitignore
├── models/
│   └── User.js             # Mongoose schema + password hashing
├── middleware/
│   └── auth.js             # requireAuth / redirectIfAuthenticated
├── routes/
│   └── auth.js             # /, /register, /login, /dashboard, /logout
├── views/
│   ├── login.ejs
│   ├── register.ejs
│   ├── dashboard.ejs
│   ├── 404.ejs
│   └── partials/
│       ├── header.ejs
│       └── footer.ejs
└── public/
    └── css/style.css
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- MongoDB, either:
  - installed locally ([MongoDB Community Server](https://www.mongodb.com/try/download/community)) and running, or
  - a free cloud database on [MongoDB Atlas](https://www.mongodb.com/atlas)

## Installation and running

Extract the ZIP, open the `auth-app` folder in VS Code, open the integrated terminal (`Ctrl + ``), then run:

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
#    macOS / Linux / Git Bash:
cp .env.example .env
#    Windows PowerShell:
#    Copy-Item .env.example .env

# 3. Edit .env: set MONGODB_URI and a long random SESSION_SECRET
#    (generate a secret with the command below)
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 4. Start the app
npm start
```

Then open **http://localhost:3000** in your browser.

For auto-restart while developing (Node 18.11+):

```bash
npm run dev
```

## Using the app

1. Go to `/register` and create an account.
2. Log in at `/login`. You are redirected to `/dashboard`.
3. Click **Log out** to end the session.

## Routes

| Method | Path          | Access        | Description                        |
|--------|---------------|---------------|------------------------------------|
| GET    | `/`           | Public        | Redirects to dashboard or login    |
| GET    | `/register`   | Guests only   | Registration form                  |
| POST   | `/register`   | Guests only   | Create a user                      |
| GET    | `/login`      | Guests only   | Login form                         |
| POST   | `/login`      | Guests only   | Verify credentials, start session  |
| GET    | `/dashboard`  | Logged in     | Protected dashboard                |
| POST   | `/logout`     | Logged in     | Destroy session                    |

## Adding this to your existing project

If you already have an Express app, copy these pieces across:

1. `models/User.js`, `middleware/auth.js`, `routes/auth.js`
2. The `session` + `MongoStore` setup and the `res.locals` middleware from `server.js`
3. `views/login.ejs` (the form needs `name="username"` and `name="password"`, `method="POST"`, `action="/login"`)
4. `npm install bcryptjs connect-mongo dotenv express-session mongoose`

## Notes

- `bcryptjs` is a pure-JavaScript bcrypt implementation. It produces standard bcrypt hashes and avoids native build problems on Windows. If you prefer the native `bcrypt` package, replace `require('bcryptjs')` with `require('bcrypt')` in `models/User.js` and install `bcrypt` instead.
- For production, serve over HTTPS and set `NODE_ENV=production` so the session cookie is `secure`.
- Consider adding rate limiting (e.g. `express-rate-limit`) on `/login` and CSRF protection (e.g. `csrf-csrf`) before going live.
- The login page reports "Invalid username" vs "Incorrect password" separately, as requested. This makes it easier for an attacker to discover which usernames exist; many production apps use one generic message instead.
