# Supabase Dashboard Setup — Build 1 Prerequisites

Complete these steps in your Supabase Dashboard before starting the auth code implementation.

---

## 1. Enable Email Provider

**Location:** Authentication → Sign In / Providers → Email

- [x] Toggle **"Enable Email provider"** → ON
- [x] Toggle **"Confirm email"** → ON (sends verification link on signup)
- Leave all other settings at defaults

---

## 2. Enable Google OAuth Provider

**Location:** Authentication → Sign In / Providers → Google

- [x] Toggle **"Enable Google provider"** → ON

You need a Google Cloud OAuth client to fill in the Client ID and Secret:

### Create Google OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create one)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Name: `BreachCase` (or anything descriptive)
7. Under **Authorized redirect URIs**, add:
   ```
   https://hlqaxsyuequldpjppidq.supabase.co/auth/v1/callback
   ```
   _(Your Supabase project URL + `/auth/v1/callback`)_
8. Click **Create**
9. Copy the **Client ID** and **Client Secret**

### Paste into Supabase

Back in Supabase Dashboard (Authentication → Providers → Google):

- Paste the **Client ID** into the "Client ID" field
- Paste the **Client Secret** into the "Client Secret" field
- Save

---

## 3. Configure Redirect URLs

**Location:** Authentication → URL Configuration (in left sidebar under CONFIGURATION)

### Site URL

Set to your primary development URL:

```
http://localhost:3000
```

_(Change this to your production URL when deploying)_

### Redirect URLs

Add these to the **Redirect URLs** list:

```
http://localhost:3000/auth/callback
```

When you have a production domain, also add:

```
https://breachcase.com/auth/callback
```

---

## 4. Verify Configuration

After completing the steps above, confirm:

| Setting | Value |
|---------|-------|
| Email provider | Enabled, confirm email ON |
| Google provider | Enabled, Client ID + Secret filled in |
| Site URL | `http://localhost:3000` |
| Redirect URLs | `http://localhost:3000/auth/callback` |

---

## Notes

- The Google OAuth consent screen may need to be configured in Google Cloud Console (APIs & Services → OAuth consent screen). For development, "External" user type with test users is fine.
- Email confirmation sends a link to the user's email. In development, you can check the Supabase Dashboard (Authentication → Users) to see pending confirmations.
- If you want to skip email confirmation during development, you can temporarily toggle "Confirm email" off — but remember to re-enable it before production.
