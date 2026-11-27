# Changelog

## 0.0.2 — 2026-11-27

- Verify mailbox ownership before issuing a session for a new registration. An existing account keeps its credentials when someone attempts to register the same address.
- Deliver invitations, email verification and password recovery through SMTP. Links expire after one hour and can be used once.
- Exclude password hashes and internal account tokens from API responses, search results, CSV exports and related user records.
- Restrict changes to other accounts and their roles to administrators. Users can still edit their own profile and change their password.
- Add an email uniqueness migration and regression tests for the generated application.

See [Account access](docs/account-access.md) for deployment and upgrade instructions.
