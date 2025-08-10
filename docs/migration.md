# Prompt for GPT

INSTRUCTIONS: Add a new model named feeds, and the associated route, page, and database table. Feeds should be specific to individual users. Follow these instructions:

* Follow the convention of the app by adding the logic for the page in src/app/<page_name>/page.tsx

* If there are any abstracted components, add those to the components folder in src/components/<page_name>/MyComponent.tsx

* Add a Supabase database migration to add the proper table, creating the proper references to other tables existing in the database.

Notes
* Add option for routes
* Add to sidebar