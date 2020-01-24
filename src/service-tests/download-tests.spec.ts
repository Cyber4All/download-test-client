const request = require('request');
import { generateUserToken } from '../drivers/jwt/tokenManager';
import { regularUser, reviewerUser, curatorUser, editorUser, adminUser } from '../users';
import { MongoDB } from '../drivers/database/mongodb/mongodb';
// import * as dotenv from 'dotenv';

let db: MongoDB;

let regToken: string, reviewerToken: string, curatorToken: string, editorToken: string, adminToken: string;
const URI = {};

const options = {
    url: '',
    headers: {
        'Authorization': 'Bearer ',
        'Content-Type': 'application/json'
    }
};

// Extend current expect functions to include a status code function
expect.extend({
    /**
     * Checks if a recieved status code is equal to a expected status code. If it fails, the returned message includes the
     * download URI that caused the failure.
     * For more information on how to create a matcher, see: https://stackoverflow.com/questions/45348083/how-to-add-custom-message-to-jest-expect
     * @param recieved The recieved status code
     * @param expected The expected status code
     */
    toBeStatusCode(recieved: number, expected: number) {
        if (recieved !== expected) {
            return {
                message: () => `Recieved incorrect status code. Recieved ${recieved}, expected ${expected} for download URI:\n${options.url}`,
                pass: false
            };
        } else {
            return {
                message: () => `Recieved correct status code. Recieved ${recieved}, expected ${expected} for download URI:\n${options.url}`,
                pass: true
            };
        }
    }
});

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

beforeAll(async done => {

    // dotenv.config(); // TODO move this to a higher up file

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

    done();
});

describe('When a Learning Object is downloaded', () => {
    describe('and the requester is unauthorized', () => {
        it('should return a status code of 401 when downloading unreleased objects', done => {
            setOptions(URI['unreleased'], '');
            // If a learning object fitting the specified requirements exist, try to download it
            if (options.url) {
                request(options).on('response', (response) => {
                    // @ts-ignore
                    expect(response.statusCode).toBeStatusCode(401);
                    done();
                });
            } else {
                expect(true).toEqual(true);
                done();
            }
        });
        it('should return a status code of 401 when downloading released objects', done => {
            setOptions(URI['released'], '');
            request(options).on('response', (response) => {
                // @ts-ignore
                expect(response.statusCode).toBeStatusCode(401);
                done();
            });
        });
        describe('and downloading an in review object', () => {
            it('should return a status code of 401 when downloading waiting objects', done => {
                setOptions(URI['waiting'], '');
                // If a learning object fitting the specified requirements exist, try to download it
                if (options.url) {
                    request(options).on('response', (response) => {
                        // @ts-ignore
                        expect(response.statusCode).toBeStatusCode(401);
                        done();
                    });
                } else {
                    expect(true).toEqual(true);
                    done();
                }
            });
            it('should return a status code of 401 when downloading in review objects', done => {
                setOptions(URI['review'], '');
                // If a learning object fitting the specified requirements exist, try to download it
                if (options.url) {
                    request(options).on('response', (response) => {
                        // @ts-ignore
                        expect(response.statusCode).toBeStatusCode(401);
                        done();
                    });
                } else {
                    expect(true).toEqual(true);
                    done();
                }
            });
            it('should return a status code of 401 when downloading proofing objects', done => {
                setOptions(URI['proofing'], '');
                // If a learning object fitting the specified requirements exist, try to download it
                if (options.url) {
                    request(options).on('response', (response) => {
                        // @ts-ignore
                        expect(response.statusCode).toBeStatusCode(401);
                        done();
                    });
                } else {
                    expect(true).toEqual(true);
                    done();
                }
            });
        });
    });
    describe('and the requester has no privileges', () => {
        it('should return a status code of 403 when downloading unreleased objects', done => {
            setOptions(URI['unreleased'], regToken);
            // If a learning object fitting the specified requirements exist, try to download it
            if (options.url) {
                request(options).on('response', (response) => {
                    // @ts-ignore
                    expect(response.statusCode).toBeStatusCode(403);
                    done();
                });
            } else {
                expect(true).toEqual(true);
                done();
            }
        });
        it('should return a status code of 200 when downloading released objects', done => {
            setOptions(URI['released'], regToken);
            request(options).on('response', (response) => {
                // @ts-ignore
                expect(response.statusCode).toBeStatusCode(200);
                done();
            });
        });
        describe('and downloading an in review object', () => {
            it('should return a status code of 403 when downloading waiting objects', done => {
                setOptions(URI['waiting'], regToken);
                // If a learning object fitting the specified requirements exist, try to download it
                if (options.url) {
                    request(options).on('response', (response) => {
                        // @ts-ignore
                        expect(response.statusCode).toBeStatusCode(403);
                        done();
                    });
                } else {
                    expect(true).toEqual(true);
                    done();
                }
            });
            it('should return a status code of 403 when downloading in review objects', done => {
                setOptions(URI['review'], regToken);
                // If a learning object fitting the specified requirements exist, try to download it
                if (options.url) {
                    request(options).on('response', (response) => {
                        // @ts-ignore
                        expect(response.statusCode).toBeStatusCode(403);
                        done();
                    });
                } else {
                    expect(true).toEqual(true);
                    done();
                }
            });
            it('should return a status code of 403 when downloading proofing objects', done => {
                setOptions(URI['proofing'], regToken);
                // If a learning object fitting the specified requirements exist, try to download it
                if (options.url) {
                    request(options).on('response', (response) => {
                        // @ts-ignore
                        expect(response.statusCode).toBeStatusCode(403);
                        done();
                    });
                } else {
                    expect(true).toEqual(true);
                    done();
                }
            });
        });
    });
    describe('and the requester has privileges', () => {
        describe('and the requester has reviewer privileges', () => {
            it('should return a status code of 403 when downloading unreleased objects', done => {
                setOptions(URI['unreleased'], reviewerToken);
                // If a learning object fitting the specified requirements exist, try to download it
                if (options.url) {
                    request(options).on('response', (response) => {
                        // @ts-ignore
                        expect(response.statusCode).toBeStatusCode(403);
                        done();
                    });
                } else {
                    expect(true).toEqual(true);
                    done();
                }
            });
            it('should return a status code of 200 when downloading released objects', done => {
                setOptions(URI['released'], reviewerToken);
                request(options).on('response', (response) => {
                    // @ts-ignore
                    expect(response.statusCode).toBeStatusCode(200);
                    done();
                });
            });
            describe('and downloading a in review object outside of their collection', () => {
                it('should return a status code of 403 when downloading waiting objects', done => {
                    setOptions(URI['caeWaiting'], reviewerToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            // @ts-ignore
                            expect(response.statusCode).toBeStatusCode(403);
                            done();
                        });
                    } else {
                        expect(true).toEqual(true);
                        done();
                    }
                });
                it('should return a status code of 403 when downloading in review objects', done => {
                    setOptions(URI['caeReview'], reviewerToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            // @ts-ignore
                            expect(response.statusCode).toBeStatusCode(403);
                            done();
                        });
                    } else {
                        expect(true).toEqual(true);
                        done();
                    }
                });
                it('should return a status code of 403 when downloading proofing objects', done => {
                    setOptions(URI['caeProofing'], reviewerToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            // @ts-ignore
                            expect(response.statusCode).toBeStatusCode(403);
                            done();
                        });
                    } else {
                        expect(true).toEqual(true);
                        done();
                    }
                });
            });
            describe('and downloading a in review object in their collection', () => {
                it('should return a status code of 200 when downloading waiting objects', done => {
                    setOptions(URI['waiting'], reviewerToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            // @ts-ignore
                            expect(response.statusCode).toBeStatusCode(200);
                            done();
                        });
                    } else {
                        expect(true).toEqual(true);
                        done();
                    }
                });
                it('should return a status code of 200 when downloading in review objects', done => {
                    setOptions(URI['review'], reviewerToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            // @ts-ignore
                            expect(response.statusCode).toBeStatusCode(200);
                            done();
                        });
                    } else {
                        expect(true).toEqual(true);
                        done();
                    }
                });
                it('should return a status code of 200 when downloading proofing objects', done => {
                    setOptions(URI['proofing'], reviewerToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            // @ts-ignore
                            expect(response.statusCode).toBeStatusCode(200);
                            done();
                        });
                    } else {
                        expect(true).toEqual(true);
                        done();
                    }
                });
            });
        });
        describe('and the requester has curator privileges', () => {
            it('should return a status code of 403 when downloading unreleased objects', done => {
                setOptions(URI['unreleased'], curatorToken);
                // If a learning object fitting the specified requirements exist, try to download it
                if (options.url) {
                    request(options).on('response', (response) => {
                        // @ts-ignore
                        expect(response.statusCode).toBeStatusCode(403);
                        done();
                    });
                } else {
                    expect(true).toEqual(true);
                    done();
                }
            });
            it('should return a status code of 200 when downloading released objects', done => {
                setOptions(URI['released'], curatorToken);
                request(options).on('response', (response) => {
                    // @ts-ignore
                    expect(response.statusCode).toBeStatusCode(200);
                    done();
                });
            });
            describe('and downloading a in review object outside of their collection', () => {
                it('should return a status code of 403 when downloading waiting objects', done => {
                    setOptions(URI['caeWaiting'], curatorToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            // @ts-ignore
                            expect(response.statusCode).toBeStatusCode(403);
                            done();
                        });
                    } else {
                        expect(true).toEqual(true);
                        done();
                    }
                });
                it('should return a status code of 403 when downloading in review objects', done => {
                    setOptions(URI['caeReview'], curatorToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            // @ts-ignore
                            expect(response.statusCode).toBeStatusCode(403);
                            done();
                        });
                    } else {
                        expect(true).toEqual(true);
                        done();
                    }
                });
                it('should return a status code of 403 when downloading proofing objects', done => {
                    setOptions(URI['caeProofing'], curatorToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            // @ts-ignore
                            expect(response.statusCode).toBeStatusCode(403);
                            done();
                        });
                    } else {
                        expect(true).toEqual(true);
                        done();
                    }
                });
            });
            describe('and downloading a in review object in their collection', () => {
                it('should return a status code of 200 when downloading waiting objects', done => {
                    setOptions(URI['waiting'], curatorToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            // @ts-ignore
                            expect(response.statusCode).toBeStatusCode(200);
                            done();
                        });
                    } else {
                        expect(true).toEqual(true);
                        done();
                    }
                });
                it('should return a status code of 200 when downloading in review objects', done => {
                    setOptions(URI['review'], curatorToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            // @ts-ignore
                            expect(response.statusCode).toBeStatusCode(200);
                            done();
                        });
                    } else {
                        expect(true).toEqual(true);
                        done();
                    }
                });
                it('should return a status code of 200 when downloading proofing objects', done => {
                    setOptions(URI['proofing'], curatorToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            // @ts-ignore
                            expect(response.statusCode).toBeStatusCode(200);
                            done();
                        });
                    } else {
                        expect(true).toEqual(true);
                        done();
                    }
                });
            });
        });
        describe('and the requester has editor privileges', () => {
            it('should return a status code of 403 when downloading unreleased objects', done => {
                setOptions(URI['unreleased'], editorToken);
                // If a learning object fitting the specified requirements exist, try to download it
                if (options.url) {
                    request(options).on('response', (response) => {
                        // @ts-ignore
                        expect(response.statusCode).toBeStatusCode(403);
                        done();
                    });
                } else {
                    expect(true).toEqual(true);
                    done();
                }
            });
            it('should return a status code of 200 when downloading released objects', done => {
                setOptions(URI['released'], editorToken);
                request(options).on('response', (response) => {
                    // @ts-ignore
                    expect(response.statusCode).toBeStatusCode(200);
                    done();
                });
            });
            describe('and downloading a in review object', () => {
                describe('and downloading waiting objects', () => {
                    it('should return a status code of 200 when downloading waiting objects from one collection', done => {
                        setOptions(URI['waiting'], editorToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                // @ts-ignore
                                expect(response.statusCode).toBeStatusCode(200);
                                done();
                            });
                        } else {
                            expect(true).toEqual(true);
                            done();
                        }
                    });
                    it('should return a status code of 200 when downloading waiting objects from another collection', done => {
                        setOptions(URI['caeWaiting'], editorToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                // @ts-ignore
                                expect(response.statusCode).toBeStatusCode(200);
                                done();
                            });
                        } else {
                            expect(true).toEqual(true);
                            done();
                        }
                    });
                });
                describe('and downloading in review objects', () => {
                    it('should return a status code of 200 when downloading in review objects from one collection', done => {
                        setOptions(URI['review'], editorToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                // @ts-ignore
                                expect(response.statusCode).toBeStatusCode(200);
                                done();
                            });
                        } else {
                            expect(true).toEqual(true);
                            done();
                        }
                    });
                    it('should return a status code of 200 when downloading in review objects from another collection', done => {
                        setOptions(URI['caeReview'], editorToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                // @ts-ignore
                                expect(response.statusCode).toBeStatusCode(200);
                                done();
                            });
                        } else {
                            expect(true).toEqual(true);
                            done();
                        }
                    });
                });
                describe('and downloading proofing objects', () => {
                    it('should return a status code of 200 when downloading proofing objects from one collection', done => {
                        setOptions(URI['proofing'], editorToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                // @ts-ignore
                                expect(response.statusCode).toBeStatusCode(200);
                                done();
                            });
                        } else {
                            expect(true).toEqual(true);
                            done();
                        }
                    });
                    it('should return a status code of 200 when downloading proofing objects from another collection', done => {
                        setOptions(URI['caeProofing'], editorToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                // @ts-ignore
                                expect(response.statusCode).toBeStatusCode(200);
                                done();
                            });
                        } else {
                            expect(true).toEqual(true);
                            done();
                        }
                    });
                });
            });
        });
        describe('and the requester has admin privileges', () => {
            it('should return a status code of 403 when downloading unreleased objects', done => {
                setOptions(URI['unreleased'], adminToken);
                // If a learning object fitting the specified requirements exist, try to download it
                if (options.url) {
                    request(options).on('response', (response) => {
                        // @ts-ignore
                        expect(response.statusCode).toBeStatusCode(403);
                        done();
                    });
                } else {
                    expect(true).toEqual(true);
                    done();
                }
            });
            it('should return a status code of 200 when downloading released objects', done => {
                setOptions(URI['released'], adminToken);
                request(options).on('response', (response) => {
                    // @ts-ignore
                    expect(response.statusCode).toBeStatusCode(200);
                    done();
                });
            });
            describe('and downloading a in review object', () => {
                describe('and downloading waiting objects', () => {
                    it('should return a status code of 200 when downloading waiting objects from one collection', done => {
                        setOptions(URI['waiting'], adminToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                // @ts-ignore
                                expect(response.statusCode).toBeStatusCode(200);
                                done();
                            });
                        } else {
                            expect(true).toEqual(true);
                            done();
                        }
                    });
                    it('should return a status code of 200 when downloading waiting objects from another collection', done => {
                        setOptions(URI['caeWaiting'], adminToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                // @ts-ignore
                                expect(response.statusCode).toBeStatusCode(200);
                                done();
                            });
                        } else {
                            expect(true).toEqual(true);
                            done();
                        }
                    });
                });
                describe('and downloading in review objects', () => {
                    it('should return a status code of 200 when downloading in review objects from one collection', done => {
                        setOptions(URI['review'], adminToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                // @ts-ignore
                                expect(response.statusCode).toBeStatusCode(200);
                                done();
                            });
                        } else {
                            expect(true).toEqual(true);
                            done();
                        }
                    });
                    it('should return a status code of 200 when downloading in review objects from another collection', done => {
                        setOptions(URI['caeReview'], adminToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                // @ts-ignore
                                expect(response.statusCode).toBeStatusCode(200);
                                done();
                            });
                        } else {
                            expect(true).toEqual(true);
                            done();
                        }
                    });
                });
                describe('and downloads proofing objects', () => {
                    it('should return a status code of 200 when downloading proofing objects from one collection', done => {
                        setOptions(URI['proofing'], adminToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                // @ts-ignore
                                expect(response.statusCode).toBeStatusCode(200);
                                done();
                            });
                        } else {
                            expect(true).toEqual(true);
                            done();
                        }
                    });
                    it('should return a status code of 200 when downloading proofing objects from another collection', done => {
                        setOptions(URI['caeProofing'], adminToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                // @ts-ignore
                                expect(response.statusCode).toBeStatusCode(200);
                                done();
                            });
                        } else {
                            expect(true).toEqual(true);
                            done();
                        }
                    });
                });
            });
        });
    });
});