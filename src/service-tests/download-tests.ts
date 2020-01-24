const request = require('request');
import { generateUserToken } from '../drivers/jwt/tokenManager';
import { regularUser, reviewerUser, curatorUser, editorUser, adminUser } from '../users';
import { MongoDB } from '../drivers/database/mongodb/mongodb';
import { OutageReport } from '../types/outageReport';

let db: MongoDB;

// @ts-ignore
let regToken: string, reviewerToken: string, curatorToken: string, editorToken: string, adminToken: string;
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

/**
 * Sets up the download URIs and user tokens
 */
async function beforeAll() {
    regToken = generateUserToken(regularUser);
    reviewerToken = generateUserToken(reviewerUser);
    curatorToken = generateUserToken(curatorUser);
    editorToken = generateUserToken(editorUser);
    adminToken = generateUserToken(adminUser);

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

let afterAll: Function = undefined;

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

/**
 * Dynamically goes through each callback to see if downloads work for each specified case
 * @param functions The next function to call
 * @param code The code to expect
 * @param group The access group
 * @param test The test
 */
async function checkStatusCode(callback: Function, code: number, group: string, test: string) {
    if (options.url) {
        await new Promise((resolve, reject) => {
            request(options).on('response', async (response) => {
                if (response.statusCode !== code) {
                    console.error(`ERROR: Recieved status code ${response.statusCode}, expected ${code}.`);
                    updateReport({ group, test });
                }
                await invokeCallback(callback);
                resolve();
            }).on('error', async (error) => {
                console.error(`ERROR: Recieved error message: `, error);
                updateReport({ group, test });
                await invokeCallback(callback);
                reject();
            });
        });
    } else {
        await invokeCallback(callback);
    }
}

/**
 * Updates the final report
 * @param params The access group and test
 */
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

/**
 * Invokes either the callback or afterAll function depending on if the callback is undefined
 * @param callback The next function to call, if exists
 */
async function invokeCallback(callback: Function) {
    if (callback) {
        await callback();
    } else {
        await afterAll(report);
    }
}

// When a Learning Object is downloaded
export async function testDownloads(callback: Function) {
    afterAll = callback;
    await beforeAll();

    await unauthorizedUserTests();

    // and the requester is unauthorized
    async function unauthorizedUserTests() {
        
        await unreleased();

        // should return a status code of 401 when downloading unreleased objects
        async function unreleased() {
            setOptions(URI['unreleased'], '');
            await checkStatusCode(released, 401, '', 'Should return a status code of 401 when downloading unreleased objects as a unauthorized user');
        }

        // should return a status code of 401 when downloading released objects
        async function released() {
            setOptions(URI['released'], '');
            await checkStatusCode(waiting, 401, '', 'Should return a status code of 401 when downloading released objects as a unauthorized user');
        }

        // should return a status code of 401 when downloading waiting objects
        async function waiting() {
            setOptions(URI['waiting'], '');
            await checkStatusCode(review, 401, '', 'Should return a status code of 401 when downloading waiting objects as a unauthorized user');
        }

        // should return a status code of 401 when downloading in review objects
        async function review() {
            setOptions(URI['review'], '');
            await checkStatusCode(proofing, 401, '', 'Should return a status code of 401 when downloading in review objects as a unauthorized user');
        }

        // should return a status code of 401 when downloading proofing objects
        async function proofing() {
            setOptions(URI['proofing'], '');
            await checkStatusCode(regularUserTests, 401, '', 'Should return a status code of 401 when downloading proofing objects as a unauthorized user');
        }
    }

    // and the requester has no privileges
    async function regularUserTests() {
        
        await unreleased();

        // should return a status code of 403 when downloading unreleased objects
        async function unreleased() {
            setOptions(URI['unreleased'], regToken);
            await checkStatusCode(released, 403, '', 'Should return a status code of 403 when downloading unreleased objects as a regular user');
        }

        // should return a status code of 200 when downloading released objects
        async function released() {
            setOptions(URI['released'], regToken);
            await checkStatusCode(waiting, 200, '', 'Should return a status code of 200 when downloading released objects as a regular user');
        }

        // should return a status code of 403 when downloading waiting objects
        async function waiting() {
            setOptions(URI['waiting'], regToken);
            await checkStatusCode(review, 403, '', 'Should return a status code of 403 when downloading waiting objects as a regular user');
        }

        // should return a status code of 403 when downloading in review objects
        async function review() {
            setOptions(URI['review'], regToken);
            await checkStatusCode(proofing, 403, '', 'Should return a status code of 403 when downloading in review objects as a regular user');
        }

        // should return a status code of 403 when downloading proofing objects
        async function proofing() {
            setOptions(URI['proofing'], regToken);
            await checkStatusCode(reviewerUserTests, 403, '', 'Should return a status code of 403 when downloading proofing objects as a regular user');
        }
    }

    // and the requester has reviewer privileges
    async function reviewerUserTests() {
        
        await unreleased();

        // should return a status code of 403 when downloading unreleased objects
        async function unreleased() {
            setOptions(URI['unreleased'], reviewerToken);
            await checkStatusCode(released, 403, 'reviewer', 'Should return a status code of 403 when downloading unreleased objects as a reviewer');
        }

        // should return a status code of 200 when downloading released objects
        async function released() {
            setOptions(URI['released'], reviewerToken);
            await checkStatusCode(waiting, 200, 'reviewer', 'Should return a status code of 200 when downloading released objects as a reviewer');
        }

        async function waiting() {

            await nccpCollection();

            // should return a status code of 200 when downloading waiting objects in their collection
            async function nccpCollection() {
                setOptions(URI['waiting'], reviewerToken);
                await checkStatusCode(caeCollection, 200, 'reviewer', 'Should return a status code of 200 when downloading waiting objects as a reviewer in their collection');
            }

            // should return a status code of 403 when downloading waiting objects outside their collection
            async function caeCollection() {
                setOptions(URI['caeWaiting'], reviewerToken);
                await checkStatusCode(review, 403, 'reviewer', 'Should return a status code of 403 when downloading waiting objects as a reviewer outside their collection');
            }
        }

        async function review() {

            await nccpCollection();

            // should return a status code of 200 when downloading in review objects in their collection
            async function nccpCollection() {
                setOptions(URI['review'], reviewerToken);
                await checkStatusCode(caeCollection, 200, 'reviewer', 'Should return a status code of 200 when downloading in review objects as a reviewer in their collection');
            }

            // should return a status code of 403 when downloading in review objects outside their collection
            async function caeCollection() {
                setOptions(URI['caeReview'], reviewerToken);
                await checkStatusCode(proofing, 403, 'reviewer', 'Should return a status code of 403 when downloading in review objects as a reviewer outside their collection');
            }
        }

        async function proofing() {

            await nccpCollection();

            // should return a status code of 200 when downloading proofing objects in their collection
            async function nccpCollection() {
                setOptions(URI['proofing'], reviewerToken);
                await checkStatusCode(caeCollection, 200, 'reviewer', 'Should return a status code of 200 when downloading proofing objects as a reviewer in their collection');
            }

            // should return a status code of 403 when downloading proofing objects outside their collection
            async function caeCollection() {
                setOptions(URI['caeProofing'], reviewerToken);
                await checkStatusCode(undefined, 403, 'reviewer', 'Should return a status code of 403 when downloading proofing objects as a reviewer outside their collection');
            }
        }
    }
}