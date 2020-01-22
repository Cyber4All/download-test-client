const request = require('request');
// import { generateUserToken } from '../drivers/jwt/tokenManager';
// import { regularUser, reviewerUser, curatorUser, editorUser, adminUser } from '../users';
import { MongoDB } from '../drivers/database/mongodb/mongodb';
import { OutageReport } from '../types/outageReport';

let db: MongoDB;

// let regToken: string, reviewerToken: string, curatorToken: string, editorToken: string, adminToken: string;
const URI = {};

const options = {
    url: '',
    headers: {
        'Authorization': 'Bearer ',
        'Content-Type': 'application/json'
    }
};

let report: OutageReport = {
    name: 'downloads',
    accessGroups: [],
    issues: [],
    discovered: null,
    links: [],
};

async function beforeAll() {
    // regToken = generateUserToken(regularUser);
    // reviewerToken = generateUserToken(reviewerUser);
    // curatorToken = generateUserToken(curatorUser);
    // editorToken = generateUserToken(editorUser);
    // adminToken = generateUserToken(adminUser);

    db = await MongoDB.getInstance();
    URI['released'] = getDownloadURI(await db.getObjectAndAuthUsername('released'));
    URI['waiting'] = getDownloadURI(await db.getObjectAndAuthUsername('waiting', 'nccp'));
    URI['proofing'] = getDownloadURI(await db.getObjectAndAuthUsername('proofing', 'nccp'));
    URI['review'] = getDownloadURI(await db.getObjectAndAuthUsername('review', 'nccp'));
    URI['unreleased'] = getDownloadURI(await db.getObjectAndAuthUsername('unreleased'));

    URI['caeWaiting'] = getDownloadURI(await db.getObjectAndAuthUsername('waiting', 'cae_community'));
    URI['caeReview'] = getDownloadURI(await db.getObjectAndAuthUsername('review', 'cae_community'));
    URI['caeProofing'] = getDownloadURI(await db.getObjectAndAuthUsername('proofing', 'cae_community'));
}

/**
 * Returns a download URI for a given learning object
 * @param param0 Contains the learning object to download and its author's username
 */
function getDownloadURI({ object, username }): string {
    if (object) {
        return `${ process.env.BASE_API_URL }/users/${ username }/learning-objects/${ object.cuid }/versions/${ object.version }/bundle`;
    } else {
        // Returns undefined so the tests can pass if there isn't a object to test
        return undefined;
    }
}

/**
 * Sets the request options
 * @param uri The object download URI
 * @param token The user's bearer token
 */
function setOptions(uri: string, token: string): void {
    options.url = uri;
    options.headers.Authorization = 'Bearer ' + token;
}

function checkStatusCode(callback: Function, code: number, group: string, test: string) {
    if (options.url) {
        request(options).on('response', (response) => {
            if (response.statusCode !== code) {
                console.error(`ERROR: Recieved status code ${response.statusCode}, expected ${code}.`);
                updateReport({ group, test });
            }
            callback(report);
        }).on('error', (error) => {
            console.error(`ERROR: Recieved error message: `, error);
            updateReport({ group, test });
            callback(report);
        });
    } else {
        callback(report);
    }
}

function updateReport(params: { group: string, test: string }) {
    const { group, test } = params;

    if (test && !report.issues.includes(test)) {
        report.issues.push(test);
    }
    if (group && !report.accessGroups.includes(group)) {
        report.accessGroups.push(group);
    }
    if (!report.links.includes(options.url)) {
        report.links.push(options.url);
    }
    if (!report.discovered) {
        report.discovered = new Date();
    }
}

// When a Learning Object is downloaded
export async function testDownloads(afterAll: Function) {
    await beforeAll();

    unauthorizedUserTests();

    // and the requester is unauthorized
    function unauthorizedUserTests() {
        
        unreleased();

        // should return a status code of 401 when downloading unreleased objects
        function unreleased() {
            setOptions(URI['unreleased'], '');
            checkStatusCode(released, 401, '', 'Should return a status code of 401 when downloading unreleased objects as a unauthorized user');
        }

        // should return a status code of 401 when downloading released objects
        function released() {
            setOptions(URI['released'], '');
            checkStatusCode(afterAll, 401, '', 'Should return a status code of 401 when downloading released objects as a unauthorized user');
        }
    }
}