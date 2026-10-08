
# AI Coding Agent Instructions

## Project
Build a provider directory for makeup artists, henna artists,
and bakers in Mombasa, Kenya.

The platform includes:
- A responsive web app
- Android and iOS mobile apps
- A provider dashboard
- An admin dashboard
- Monthly provider subscriptions

## Product Rules
- Customers can browse listings without an account.
- Only approved and paid providers appear publicly.
- Providers manage their own profiles and services.
- Providers pay a monthly subscription.
- Customers contact providers directly.
- Customer payments to providers are outside the MVP.
<!-- - Do not implement booking commissions or delivery management. -->

## Technology
- TypeScript
- Next.js for web
- Expo and React Native for mobile
- Supabase for database, authentication, and storage
- M-Pesa payment integration through a trusted backend

## Development Rules
1. Read this file before starting every task.
2. Read the README and relevant architecture documents.
3. Inspect the existing code before making changes.
4. Do not replace working code without a clear reason.
5. Break large tasks into small, testable steps.
6. Use shared types and validation where appropriate.
7. Keep secrets out of source code.
8. Never trust client-side payment status.
9. Enforce authorization on the server.
10. Use database migrations for schema changes.
11. Add tests for important business rules.
12. Run relevant tests, linting, and type checks.
13. Report failures honestly.
14. Do not claim a feature is complete unless it works.
15. Ask for clarification when requirements are ambiguous.

## Subscription Rules
- Store subscription periods explicitly.
- Record every payment attempt.
- Use unique transaction references.
- Do not activate a subscription before payment confirmation.
- Handle duplicate payment callbacks safely.
- Do not extend a subscription twice for one payment.
- Hide expired listings according to the approved policy.
- Preserve payment and admin audit history.

## Security
- Apply role-based access control.
- Providers may edit only their own profiles.
- Customers may read only public listings.
- Admin operations require admin authorization.
- Validate all user input.
- Restrict portfolio upload file types and sizes.
- Never expose private environment variables.

## Git Workflow
- Use a feature branch for substantial work.
- Make small, descriptive commits.
- Do not commit secrets or credentials.
- Update documentation when behavior changes.
- Summarize changed files and tests after each task.

## Completion Report
For each task, report:
- What was implemented
- Files changed
- Tests executed
- Known limitations
- Recommended next task


# To Do
- Add a appointments date and time for the customer to book 
- a calender for the service provider which shows dates available and dates already booked by clients
- a date is booked upon payment by the client by paying a small deposit
- The provider should accept or decline or re appoint for another time or schedule. 
- Add a login page for provider and view the appointments. 
- there should be an ID verification to confirm that the service provide information given is correct
- a blue tick for verification is given once a service provider has paid the subscription and admin has accepted 
- the blue tick should show against the providers name
- It is not based in Mombasa only. 