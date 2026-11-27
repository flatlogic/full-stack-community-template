# Account access

A new user registers, confirms the link sent to their mailbox, and signs in. Registration returns a confirmation without a session token. An administrator can invite a user individually or by CSV. Invited users set their first password through the emailed link. Password recovery also delivers a link to the account's mailbox. Links expire after one hour and can be used once.

Configure the public frontend origin and an SMTP relay before enabling signups. See the **Account email** section of the generated backend README for the variables. Confirm that your relay accepts the sender and delivers to a test mailbox.

The default login page displays the seeded demo credentials. Before using real accounts or data, provision an administrator you control, disable the demo accounts, and remove the demo credentials from the login page.

## Updating an existing application

1. Back up the database. Merge the account changes into your generated backend and frontend together, preserving local customizations and schema fields. A template update applies when generating a new app.
2. Install the backend dependencies from the updated lockfile and apply the database migrations. The email migration trims and lowercases addresses before enforcing uniqueness. If it reports duplicate identities, resolve ownership of the affected accounts before retrying.
3. Deploy both parts, then test registration, verification, an invitation and password recovery with a mailbox you control. Request fresh links after upgrading. Check that user lists, profiles and CSV exports omit credential fields.
4. If you suspect a particular account was accessed, review its sign-in and activity records, revoke its sessions and have its owner reset the password. Installing the patch does not erase earlier activity.

## Testing a generated copy

The integration suite starts its own loopback HTTP server and SMTP inbox. Use an empty local PostgreSQL database named `community_qa`, apply the generated backend migrations and seeders, then run the following from the template checkout. Set `DB_USER`, `DB_HOST` and `DB_PORT` to your local test database settings.

```sh
NODE_ENV=production DB_NAME=community_qa COMMUNITY_QA_BACKEND=/path/to/generated/backend \
  node --test tests/auth-lifecycle.test.cjs
```
