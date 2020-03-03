import { Request, Response } from 'express';
import { MongoDB } from '../drivers/database/mongodb/mongodb';
import * as dotenv from 'dotenv';
import { downloadTestHandler } from '../handler/downloads/handler';
// @ts-ignore
// import * as swaggerJsdoc from 'swagger-jsdoc';
// @ts-ignore
// import * as swaggerUi from 'swagger-ui-express';

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const version = require('../../package.json').version;
const bodyParser = require('body-parser');
const express = require('express');

startServer();

/**
 * This file is used to start up a simple express app for the purpose
 * of developing and testing new handler functions.  If you want to
 * create a new lambda function, create a new route here to invoke it.
 */
function startServer() {
    dotenv.config(); // TODO move this to a higher up file
    const app = express();
    
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    
    app.use((_req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        next();
    });
    
    const port = process.env.PORT || 4800;

    app.get('/downloads', async (_req: Request, res: Response) => {
        const database = await MongoDB.getInstance();
        // undefined is passed here because the function does not have the lambda event or context.
        // Callback may be used to show that something is done.
        await downloadTestHandler(undefined, undefined, () => console.log('DONE'));

        const issue = await database.getActiveIssue('downloads');
        res.status(200).send(issue);
    });

    setUpSwagger(app, port);

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

function setUpSwagger(app, port) {
    const options = {
        swaggerDefinition: {
          openapi: '3.0.0',
          info: {
            title: 'Time to document that Express API you built',
            version: version,
            description:
              'Express api that is used to test system outage lambdas',
            license: {
              name: 'MIT',
              url: 'https://choosealicense.com/licenses/mit/'
            },
            contact: {
              name: 'CLARK',
              url: 'https://clark.center',
              email: 'skaza@towson.edu'
            }
          },
          servers: [
            {
              url: `http://localhost:${port}`
            }
          ]
        },
        apis: [
            './src/types/outageReport.ts'
        ]
    };
    const specs = swaggerJsdoc(options);
    app.use('/docs', swaggerUi.serve);
    app.get(
        '/docs',
        swaggerUi.setup(specs, {
            explorer: true
        })
    );
}