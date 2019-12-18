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
        // res.status(200).send("Hello World!");
        // exec('npm test --outputFile=test-results.json', (err, stdout, stderr) => {
        //     if (err) {
        //         res.status(500).send({});
        //     } else {
        //         const contents = fs.readFileSync('test-results.json');
        //         const jsonContent = JSON.parse(contents.toString());
        //         res.status(200).send(jsonContent); 
        //     }
        // });

        const code = exec('npm test');
        
        if (code !== '0') {
            const contents = fs.readFileSync('test-results.json');
            const jsonContent = JSON.parse(contents.toString());
            res.status(200).send(jsonContent);
        } else {
            res.status(200).send(code);
        }
    });

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}