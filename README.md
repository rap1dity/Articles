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
+-- public
+-- src
|   +-- article
|   |   +-- dto
|   |   +-- entities
|   +-- auth
|   +-- common
|   |   +-- config
|   +-- decorators
|   +-- exceptions
|   +-- guards
|   +-- migrations
|   +-- pipes
|   +-- redis
|   +-- users
|   |   +-- dto
|   |   +-- entities
```