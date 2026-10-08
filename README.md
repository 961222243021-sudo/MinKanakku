# MinKanakku — Vercel deployment

This package contains the complete static MinKanakku website: Tamil and English, guided calculator, light/dark themes, MK logo, and lightning background.

## Deploy
1. Extract this ZIP.
2. Open a terminal in the extracted folder.
3. Run `npx vercel login` and sign in to an account that can create projects.
4. Run `npx vercel --prod`.
5. Choose your Vercel account/team, create a new project named minkanakku, and use this folder as the project root.

The included vercel.json serves dist directly. No build step, environment variables, backend, or database is required.

For Git deployments: upload this folder to your GitHub repository, import that repository in Vercel, and use framework Other with output directory dist and no build/install commands.

## Tariff data
The calculator uses a manually checked tariff snapshot dated 8 October 2026. It does not fetch live government updates. Domestic two-month estimates cover energy charges; the historical baseline is reconstructed and labelled in the UI.

Source snapshot: b1180c2676cac6eb56d88109ad237d08ce2f4111
