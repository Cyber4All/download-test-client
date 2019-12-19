import { exec } from 'shelljs';
import * as fs from 'fs';
// import * as express from 'express';
import { Request, Response } from 'express';

const bodyParser = require('body-parser');
const express = require('express');

startServer();

function startServer() {
    const app = express();
    
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    
    app.use((_req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        next();
    });
    
    const port = process.env.PORT || 4800;

    app.get('/downloads', (_req: Request, res: Response) => {
        const code = exec('npm test');
        
        if (code !== '0') {
            const contents = fs.readFileSync('test-results.json');
            const jsonContent = JSON.parse(contents.toString());
            
            const issues: string[] = [];
            jsonContent.testResults[1].assertionResults.map(result => {
                if (result.status === 'failed') {
                  issues.push(result.fullName);
                }
            });

            const accessGroups: string[] = [];
            issues.map((i: string) => {
                if (i.includes('admin') && !accessGroups.includes('admin')) {
                    accessGroups.push('admin');
                } else if (i.includes('editor') && !accessGroups.includes('editor')) {
                    accessGroups.push('editor');
                } else if (i.includes('curator') && !accessGroups.includes('curator')) {
                    accessGroups.push('curator');
                } else if (i.includes('reviewer') && !accessGroups.includes('reviewer')) {
                    accessGroups.push('reviewer');
                }
            });
            res.status(200).send({accessGroups, issues});
        } else {
            res.status(200).send(code);
        }
    });

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}