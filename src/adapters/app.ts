import { Request, Response } from 'express';
import { MongoDB } from '../drivers/database/mongodb/mongodb';
import * as dotenv from 'dotenv';
import { testDownloads } from '../service-tests/download-tests';
import { OutageReport, OutageReportUpdates } from '../types/outageReport';
// import { handler } from '../handler/downloads/handler';

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
        await testDownloads(async (report: OutageReport) => {
            // Get active report
            const activeIssue = await database.getActiveIssue('downloads');
            
            if (activeIssue && report) { // If there are report updates...
                if (report.accessGroups !== activeIssue.accessGroups || report.issues !== activeIssue.issues || report.links !== activeIssue.links) {
                    const updates: OutageReportUpdates = {
                        accessGroups: report.accessGroups,
                        issues: report.issues
                    };
                    // Dynamically set links since it is optional in mongo
                    if (report.links) {
                      updates['links'] = report.links;
                    }
            
                    await database.updateActiveIssue(updates, 'downloads');
                }
            } else if (report) { // If there is a new report...
                await database.createNewIssue(report);
            } else { // If a old report needs to be resolved...
                await database.updateActiveIssue({ resolved: new Date() }, 'downloads');
            }
        });
        const issue = await database.getActiveIssue('downloads');
        res.status(200).send(issue);
    });

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}