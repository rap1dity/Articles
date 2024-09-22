# Articles
Use following command to run server or tests:
```sh
npm run start
npm run test
```
Migrations
```sh
npm run migration:generate --path
npm run migrate
npm run migrate:down
```
## Project folder structure
```js
+-- dist
+-- src
|   +-- article
|   |   +-- dto
|   |   +-- entities
|   +-- auth
|   +-- common
|   |   +-- config
|   |   +-- types
|   +-- decorators
|   +-- exceptions
|   +-- guards
|   +-- migrations
|   +-- pipes
|   +-- redis
|   +-- tokens
|   |   +-- entities
|   +-- users
|   |   +-- dto
|   |   +-- entities
```