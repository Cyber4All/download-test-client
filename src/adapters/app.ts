import { Request, Response } from 'express';
import { MongoDB } from '../drivers/database/mongodb/mongodb';
import * as dotenv from 'dotenv';
import { testDownloads } from '../handler/downloads/handler';

const bodyParser = require('body-parser');
const express = require('express');

startServer();

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
        await testDownloads();

        const issue = await database.getActiveIssue('downloads');
        res.status(200).send(issue);
    });

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}