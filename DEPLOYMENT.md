# Secure availability setup

The manager page is built for Cloudflare Pages. The public website can read availability, but publishing requires a password that exists only on the server.

The login also limits incorrect password attempts to five per 15 minutes.

## One-time setup

1. Deploy this repository as a Cloudflare Pages project.
2. In **Settings → Functions → KV namespace bindings**, create a binding named `AVAILABILITY` and connect a KV namespace.
3. In **Settings → Environment variables**, add an encrypted secret named `ADMIN_PASSWORD` and set it to Vladimir's private password.
4. Redeploy the project.
5. Open `/admin.html`, sign in, update the three messages, and select **Publish to website**.

Do not put the password in `admin.js`, `index.html`, Git, or any other project file.
