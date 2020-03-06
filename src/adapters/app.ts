import { Request, Response } from 'express';
import { MongoDB } from '../drivers/database/mongodb/mongodb';
import * as dotenv from 'dotenv';
import { downloadTestHandler } from '../handler/downloads/handler';
import * as fs from 'fs';

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

    /**
     * @swagger
     * path:
     *  /downloads:
     *      get:
     *          summary: Runs download tests for the system
     *          tags: [Downloads]
     *          responses:
     *              "200":
     *                  description: Returns an active downloads issue, if it exists, after running the download tests
     *                  content:
     *                      application/json:
     *                          schema:
     *                              $ref: '#/components/schemas/OutageReport'
     */
    app.get('/downloads', async (_req: Request, res: Response) => {
        const database = await MongoDB.getInstance();
        // undefined is passed here because the function does not have the lambda event or context.
        // Callback may be used to show that something is done.
        await downloadTestHandler(undefined, undefined, () => console.log('DONE'));

        const issue = await database.getActiveIssue('downloads');
        const result = issue ? issue : {};
        res.status(200).send(result);
    });

    setUpSwagger(app, port);

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

/**
 * Sets up swagger documentation and generates a swagger json
 * file that is used to write tests
 * @param app The express app
 * @param port The exposed port number
 */
function setUpSwagger(app, port) {
  // Options used to generate swagger docs
  const options = {
    swaggerDefinition: {
      openapi: '3.0.0',
      info: {
        title: 'System Status Lambda Express API',
        version: version,
        description:
          'Express api that is used to test system outage lambdas',
        license: {
          name: 'ISC',
          url: 'https://www.isc.org/licenses/'
        },
        contact: {
          name: 'CLARK',
          url: 'https://clark.center',
          email: 'skaza@towson.edu'
        }
      },
      servers: [
        {
          url: `http://localhost:${port}`,
          description: 'Development'
        }
      ]
    },
    apis: [
      './src/types/outageReport.ts',
      './src/adapters/app.ts'
    ]
  };

  const specs = swaggerJsdoc(options);

  // Write specs object out as a swagger.json file
  fs.writeFile('swagger.json', JSON.stringify(specs), (err) => {
    if (err) {
      console.error(err);
    }
  });

  // Create route to see swagger docs
  app.use('/docs', swaggerUi.serve);
  app.get(
    '/docs',
    swaggerUi.setup(specs, {
        explorer: true
    })
  );
}