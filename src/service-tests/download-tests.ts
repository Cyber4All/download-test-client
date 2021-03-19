import { generateUserToken } from '../drivers/jwt/tokenManager';
import { regularUser, reviewerUser, curatorUser, editorUser, adminUser } from '../users';
import { MongoDB } from '../drivers/database/mongodb/mongodb';
import { OutageReport } from '../types/outageReport';
import * as fetch from 'node-fetch';

const OK = 200, FORBIDDEN = 403;
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
function getDownloadURI(params: { object, username }): string {
    const { object, username } = params;
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
    options.headers['Authorization'] = 'Bearer ' + token;
}

/**
 * This checks the status of the response from the node-fetch
 * statement to see if it threw an error message
 * 
 * @param res The node-fetch response object
 * @returns The json of the request or throws and error
 */
 function checkStatus(res: any): Promise<any> {
    // res.status >= 200 && res.status < 300
    if (res.status && res.status >= 200 && res.status < 600) {
        return res;
    } else {
        throw res;
    }
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
            fetch(options.url, options)
            .then(checkStatus)
            .then(async (res: any) => {
                if (res.status !== code) {
                    console.error(`Recieved status code ${res.status}, expected ${code} on URI ${options.url}`);
                    updateReport({ group, test });
                }
                await invokeCallback(callback);
                resolve(null);
            }).catch(async (error: Error) => {
                console.error(`Recieved error message: `, error);
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

    await regularUserTests();

    // and the requester has no privileges
    async function regularUserTests() {
        
        await unreleased();

        // should return a status code of FORBIDDEN when downloading unreleased objects
        async function unreleased() {
            setOptions(URI['unreleased'], regToken);
            await checkStatusCode(released, FORBIDDEN, '', 'Should return a status code of FORBIDDEN when downloading unreleased objects as a regular user');
        }

        // should return a status code of OK when downloading released objects
        async function released() {
            setOptions(URI['released'], regToken);
            await checkStatusCode(waiting, OK, '', 'Should return a status code of OK when downloading released objects as a regular user');
        }

        // should return a status code of FORBIDDEN when downloading waiting objects
        async function waiting() {
            setOptions(URI['waiting'], regToken);
            await checkStatusCode(review, FORBIDDEN, '', 'Should return a status code of FORBIDDEN when downloading waiting objects as a regular user');
        }

        // should return a status code of FORBIDDEN when downloading in review objects
        async function review() {
            setOptions(URI['review'], regToken);
            await checkStatusCode(proofing, FORBIDDEN, '', 'Should return a status code of FORBIDDEN when downloading in review objects as a regular user');
        }

        // should return a status code of FORBIDDEN when downloading proofing objects
        async function proofing() {
            setOptions(URI['proofing'], regToken);
            await checkStatusCode(reviewerUserTests, FORBIDDEN, '', 'Should return a status code of FORBIDDEN when downloading proofing objects as a regular user');
        }
    }

    // and the requester has reviewer privileges
    async function reviewerUserTests() {
        
        await unreleased();

        // should return a status code of FORBIDDEN when downloading unreleased objects
        async function unreleased() {
            setOptions(URI['unreleased'], reviewerToken);
            await checkStatusCode(released, FORBIDDEN, 'reviewer', 'Should return a status code of FORBIDDEN when downloading unreleased objects as a reviewer');
        }

        // should return a status code of OK when downloading released objects
        async function released() {
            setOptions(URI['released'], reviewerToken);
            await checkStatusCode(waiting, OK, 'reviewer', 'Should return a status code of OK when downloading released objects as a reviewer');
        }

        async function waiting() {

            await nccpCollection();

            // should return a status code of OK when downloading waiting objects in their collection
            async function nccpCollection() {
                setOptions(URI['waiting'], reviewerToken);
                await checkStatusCode(caeCollection, OK, 'reviewer', 'Should return a status code of OK when downloading waiting objects as a reviewer in their collection');
            }

            // should return a status code of FORBIDDEN when downloading waiting objects outside their collection
            async function caeCollection() {
                setOptions(URI['caeWaiting'], reviewerToken);
                await checkStatusCode(review, FORBIDDEN, 'reviewer', 'Should return a status code of FORBIDDEN when downloading waiting objects as a reviewer outside their collection');
            }
        }

        async function review() {

            await nccpCollection();

            // should return a status code of OK when downloading in review objects in their collection
            async function nccpCollection() {
                setOptions(URI['review'], reviewerToken);
                await checkStatusCode(caeCollection, OK, 'reviewer', 'Should return a status code of OK when downloading in review objects as a reviewer in their collection');
            }

            // should return a status code of FORBIDDEN when downloading in review objects outside their collection
            async function caeCollection() {
                setOptions(URI['caeReview'], reviewerToken);
                await checkStatusCode(proofing, FORBIDDEN, 'reviewer', 'Should return a status code of FORBIDDEN when downloading in review objects as a reviewer outside their collection');
            }
        }

        async function proofing() {

            await nccpCollection();

            // should return a status code of OK when downloading proofing objects in their collection
            async function nccpCollection() {
                setOptions(URI['proofing'], reviewerToken);
                await checkStatusCode(caeCollection, OK, 'reviewer', 'Should return a status code of OK when downloading proofing objects as a reviewer in their collection');
            }

            // should return a status code of FORBIDDEN when downloading proofing objects outside their collection
            async function caeCollection() {
                setOptions(URI['caeProofing'], reviewerToken);
                await checkStatusCode(curatorUserTests, FORBIDDEN, 'reviewer', 'Should return a status code of FORBIDDEN when downloading proofing objects as a reviewer outside their collection');
            }
        }
    }

    // and the requester has curator privileges
    async function curatorUserTests() {
        await unreleased();

        // should return a status code of FORBIDDEN when downloading unreleased objects
        async function unreleased() {
            setOptions(URI['unreleased'], curatorToken);
            await checkStatusCode(released, FORBIDDEN, 'curator', 'Should return a status code of FORBIDDEN when downloading unreleased objects as a curator');
        }

        // should return a status code of OK when downloading released objects
        async function released() {
            setOptions(URI['released'], curatorToken);
            await checkStatusCode(waiting, OK, 'curator', 'Should return a status code of OK when downloading released objects as a curator');
        }

        async function waiting() {

            await nccpCollection();

            // should return a status code of OK when downloading waiting objects in their collection
            async function nccpCollection() {
                setOptions(URI['waiting'], curatorToken);
                await checkStatusCode(caeCollection, OK, 'curator', 'Should return a status code of OK when downloading waiting objects as a curator in their collection');
            }

            // should return a status code of FORBIDDEN when downloading waiting objects outside their collection
            async function caeCollection() {
                setOptions(URI['caeWaiting'], curatorToken);
                await checkStatusCode(review, FORBIDDEN, 'curator', 'Should return a status code of FORBIDDEN when downloading waiting objects as a curator outside their collection');
            }
        }

        async function review() {

            await nccpCollection();

            // should return a status code of OK when downloading in review objects in their collection
            async function nccpCollection() {
                setOptions(URI['review'], curatorToken);
                await checkStatusCode(caeCollection, OK, 'curator', 'Should return a status code of OK when downloading in review objects as a curator in their collection');
            }

            // should return a status code of FORBIDDEN when downloading in review objects outside their collection
            async function caeCollection() {
                setOptions(URI['caeReview'], curatorToken);
                await checkStatusCode(proofing, FORBIDDEN, 'curator', 'Should return a status code of FORBIDDEN when downloading in review objects as a curator outside their collection');
            }
        }

        async function proofing() {

            await nccpCollection();

            // should return a status code of OK when downloading proofing objects in their collection
            async function nccpCollection() {
                setOptions(URI['proofing'], curatorToken);
                await checkStatusCode(caeCollection, OK, 'curator', 'Should return a status code of OK when downloading proofing objects as a curator in their collection');
            }

            // should return a status code of FORBIDDEN when downloading proofing objects outside their collection
            async function caeCollection() {
                setOptions(URI['caeProofing'], curatorToken);
                await checkStatusCode(editorUserTests, FORBIDDEN, 'curator', 'Should return a status code of FORBIDDEN when downloading proofing objects as a curator outside their collection');
            }
        }
    }

    // and the requester has editor privileges
    async function editorUserTests() {

        await unreleased();

        // should return a status code of FORBIDDEN when downloading unreleased objects
        async function unreleased() {
            setOptions(URI['unreleased'], editorToken);
            await checkStatusCode(released, FORBIDDEN, 'editor', 'Should return a status code of FORBIDDEN when downloading unreleased objects as a editor');
        }

        // should return a status code of OK when downloading released objects
        async function released() {
            setOptions(URI['released'], editorToken);
            await checkStatusCode(waiting, OK, 'editor', 'Should return a status code of OK when downloading released objects as a editor');
        }

        async function waiting() {

            await nccpCollection();

            // should return a status code of OK when downloading waiting objects from one collection
            async function nccpCollection() {
                setOptions(URI['waiting'], editorToken);
                await checkStatusCode(caeCollection, OK, 'editor', 'Should return a status code of OK when downloading waiting objects as a editor in one collection');
            }

            // should return a status code of OK when downloading waiting objects from another collection
            async function caeCollection() {
                setOptions(URI['caeWaiting'], editorToken);
                await checkStatusCode(review, OK, 'editor', 'Should return a status code of OK when downloading waiting objects as a editor in another collection');
            }
        }

        async function review() {

            await nccpCollection();

            // should return a status code of OK when downloading in review objects from one collection
            async function nccpCollection() {
                setOptions(URI['review'], editorToken);
                await checkStatusCode(caeCollection, OK, 'editor', 'Should return a status code of OK when downloading in review objects as a editor in one collection');
            }

            // should return a status code of OK when downloading in review objects from another collection
            async function caeCollection() {
                setOptions(URI['caeReview'], editorToken);
                await checkStatusCode(proofing, OK, 'editor', 'Should return a status code of OK when downloading in review objects as a editor in another collection');
            }
        }

        async function proofing() {

            await nccpCollection();

            // should return a status code of OK when downloading proofing objects from one collection
            async function nccpCollection() {
                setOptions(URI['proofing'], editorToken);
                await checkStatusCode(caeCollection, OK, 'editor', 'Should return a status code of OK when downloading proofing objects as a editor in one collection');
            }

            // should return a status code of OK when downloading proofing objects from another collection
            async function caeCollection() {
                setOptions(URI['caeProofing'], editorToken);
                await checkStatusCode(adminUserTests, OK, 'editor', 'Should return a status code of OK when downloading proofing objects as a editor in another collection');
            }
        }
    }

    // and the requester has admin privileges
    async function adminUserTests() {

        await unreleased();

        // should return a status code of FORBIDDEN when downloading unreleased objects
        async function unreleased() {
            setOptions(URI['unreleased'], adminToken);
            await checkStatusCode(released, FORBIDDEN, 'admin', 'Should return a status code of FORBIDDEN when downloading unreleased objects as a admin');
        }

        // should return a status code of OK when downloading released objects
        async function released() {
            setOptions(URI['released'], adminToken);
            await checkStatusCode(waiting, OK, 'admin', 'Should return a status code of OK when downloading released objects as a admin');
        }

        async function waiting() {

            await nccpCollection();

            // should return a status code of OK when downloading waiting objects from one collection
            async function nccpCollection() {
                setOptions(URI['waiting'], adminToken);
                await checkStatusCode(caeCollection, OK, 'admin', 'Should return a status code of OK when downloading waiting objects as a admin in one collection');
            }

            // should return a status code of OK when downloading waiting objects from another collection
            async function caeCollection() {
                setOptions(URI['caeWaiting'], adminToken);
                await checkStatusCode(review, OK, 'admin', 'Should return a status code of OK when downloading waiting objects as a admin in another collection');
            }
        }

        async function review() {

            await nccpCollection();

            // should return a status code of OK when downloading in review objects from one collection
            async function nccpCollection() {
                setOptions(URI['review'], adminToken);
                await checkStatusCode(caeCollection, OK, 'admin', 'Should return a status code of OK when downloading in review objects as a admin in one collection');
            }

            // should return a status code of OK when downloading in review objects from another collection
            async function caeCollection() {
                setOptions(URI['caeReview'], adminToken);
                await checkStatusCode(proofing, OK, 'admin', 'Should return a status code of OK when downloading in review objects as a admin in another collection');
            }
        }

        async function proofing() {

            await nccpCollection();

            // should return a status code of OK when downloading proofing objects from one collection
            async function nccpCollection() {
                setOptions(URI['proofing'], adminToken);
                await checkStatusCode(caeCollection, OK, 'admin', 'Should return a status code of OK when downloading proofing objects as a admin in one collection');
            }

            // should return a status code of OK when downloading proofing objects from another collection
            async function caeCollection() {
                setOptions(URI['caeProofing'], adminToken);
                await checkStatusCode(undefined, OK, 'admin', 'Should return a status code of OK when downloading proofing objects as a admin in another collection');
            }
        }
    }
}