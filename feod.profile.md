---
feod-profile: 1
---

# FEOD profile

> Overrides the defaults of the feod skill. To change it, run the skill's init flow again.

| Parameter | Value |
|-----------|-------|
| modification | base |
| multiapp | no |
| framework | vue (spa) |
| srcRoot / alias | src / @ |
| layers | app, pages, modules, common, globals |
| pages | keep |
| modulePages | yes |
| fileBasedRouting | no (manual router in `app/router.ts`, file names follow the convention) |
| privatePageModules (`pages/_name/`) | allow |
| common.allowIndex | false |
| modules.allowDeepImports | false |
| singleFileModules | no |
| transitModules | none |
| uiKit | PrimeVue from npm, no own wrapper module yet |
| layouts | app only |
| ioc | required for cross-module links |
| ddd | no |
| lint | eslint (wired) |

## Project notes

- Server state goes through TanStack Query, local UI state through Pinia, as the project charter says.
- Modules do not import each other: pages compose `Account`, `Match` and `Game` through props and slots.
- The charter describes this structure with FSD layers; FEOD replaces them by the team's decision.
