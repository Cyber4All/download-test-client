# AWS Lambda Status Reports

## Developing the Functions and Running the Express App

When developing an AWS Lambda Function, there are a few things you have to do to get started.  First, you should create a new handler function in the src/handler directory, this new handler should be in it's own folder as well.  Second, you will have to create a test file in the src/service-tests directory.

If you need drivers such as a MongoDB Connection or a JWT Token Manager, see the src/drivers folder.

To test you function easily, there is a wrapper express app in the src/adapters folder.  Simply create a new route for your new function and test/debug that way.

When you are finished developing, update the route's comments with [Swagger/Open API Documentation](https://swagger.io/docs/specification/basic-structure/).

## Adding the Function to Serverless

When development is done for a given function, you need to add it to the serverless.yml file at the root of this project.  Go down to 'functions' in the yml and add a new function there.  This is used to update/create the lambdas using the command line.  To update manually, install the [Serverless Package](https://www.npmjs.com/package/serverless), login, and run either:

```
$ serverless deploy

$ npm run deploy
```

## Creating Functional Tests for the Lambdas

This repo uses Postman API testing to run functional tests.  To generate these tests, either:

1. Import the 'System Status Lambda Express API.postman_collection.json' file at the root of this project to postman and write your tests for the given route you created in express.  After you do this, and ensure the collection runs correctly (this may take a little bit), export the collection too json format and replace this file.

2. Take the 'swagger.json' file at the root of this project and import it to postman and write your tests and copy the other tests over from the previous file.  Ensure that the collection runs correctly, export the collection to json format and replace the 'System Status Lambda Express API.postman_collection.json' file.

These tests are used in the CI/CD pipeline to test out the routes.  To test them from the command line, install [Newman](https://www.npmjs.com/package/newman) and run either:

```
$ # Starts up the express server and runs functional tests
$ npm run ci

$ # Only runs functional tests
$ npm run newman-test
```

## Updating the CI/CD Pipeline

The CI/CD pipeline configuration is defined in the .circleci folder at the root of this project.  Essentially, it will run unit tests, functional tests, and deploy the new lambdas when changes are merged into master.

Functional tests are structured around using docker-compose because, as of right now (4/1/2020), circleci does not allow you to start services locally and connect to them.  The yml file waits for a status code from the docker-compose command to know whether or not the functional tests passed.

Once the database is spinned up (docker-compose.yml file), it will spin up this repo's express application and run the functional tests (functional-tests.sh file).

If you need to add another service, such as elasticsearch, do so in the docker-compose file.  If you need to download data similar to how a database image is downloaded during the CI/CD pipeline, update the config.yml file.  If you need to add another ENV Variable but cannot do so in the CircleCI dashboard, see the AWS SSM service and 'export KEY' command in the config.yml file.