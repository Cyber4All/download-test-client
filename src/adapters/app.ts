import { Request, Response } from 'express';
import { MongoDB } from '../drivers/database/mongodb/mongodb';
import * as dotenv from 'dotenv';
import { handler } from '../handler/downloads/handler';

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
        await handler(undefined, undefined, () => console.log('DONE'));

        const issue = await database.getActiveIssue('downloads');
        res.status(200).send(issue);
    });

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}