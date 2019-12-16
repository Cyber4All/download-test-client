const request = require('request');
import * as dotenv from 'dotenv';
import { generateUserToken } from '../drivers/jwt/tokenManager';
import { regularUser, reviewerUser, curatorUser, editorUser, adminUser } from '../users';
import { MongoDB } from '../drivers/database/mongodb/mongodb';

dotenv.config(); // TODO move this to a higher up file

let db: MongoDB;

let regToken: string, reviewerToken: string, curatorToken: string, editorToken: string, adminToken: string;
let releasedURI: string, waitingURI: string, proofingURI: string, reviewURI: string, unreleasedURI: string, caeWaitingURI: string, caeReviewURI: string, caeProofingURI: string;

const options = {
    url: '',
    headers: {
        'Authorization': 'Bearer ',
        'Content-Type': 'application/json'
    }
};

/**
 * Returns a download URI for a given learning object
 * @param param0 Contians the learning object to download and its author's username
 */
function getDownloadURI({ object, username }): string {
    if (object) {
        return `${ process.env.BASE_API_URL }/users/${ username }/learning-objects/${ object.cuid }/versions/${ object.version }/bundle`;
    } else {
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

beforeAll(async () => {
    regToken = generateUserToken(regularUser);
    reviewerToken = generateUserToken(reviewerUser);
    curatorToken = generateUserToken(curatorUser);
    editorToken = generateUserToken(editorUser);
    adminToken = generateUserToken(adminUser);

    db = await MongoDB.getInstance();
    releasedURI = getDownloadURI(await db.getObjectAndAuthUsername('released'));
    waitingURI = getDownloadURI(await db.getObjectAndAuthUsername('waiting', 'nccp'));
    proofingURI = getDownloadURI(await db.getObjectAndAuthUsername('proofing', 'nccp'));
    reviewURI = getDownloadURI(await db.getObjectAndAuthUsername('review', 'nccp'));
    unreleasedURI = getDownloadURI(await db.getObjectAndAuthUsername('unreleased'));

    caeWaitingURI = getDownloadURI(await db.getObjectAndAuthUsername('waiting', 'cae_community'));
    caeReviewURI = getDownloadURI(await db.getObjectAndAuthUsername('review', 'cae_community'));
    caeProofingURI = getDownloadURI(await db.getObjectAndAuthUsername('proofing', 'cae_community'));
});

describe('When a Learning Object is downloaded', () => {
    describe('and the requester is unauthorized', () => {
        it('should return a status code of 401 when downloading unreleased objects', done => {
            setOptions(unreleasedURI, '');
            // If a learning object fitting the specified requirements exist, try to download it
            if (options.url) {
                request(options).on('response', (response) => {
                    expect(response.statusCode).toBe(401);
                    done();
                });
            } else {
                expect(true).toEqual(true);
                done();
            }
        });
        it('should return a status code of 401 when downloading released objects', done => {
            setOptions(releasedURI, '');
            request(options).on('response', (response) => {
                expect(response.statusCode).toBe(401);
                done();
            });
        });
        describe('and downloading an in review object', () => {
            it('should return a status code of 401 when downloading waiting objects', done => {
                setOptions(waitingURI, '');
                // If a learning object fitting the specified requirements exist, try to download it
                if (options.url) {
                    request(options).on('response', (response) => {
                        expect(response.statusCode).toBe(401);
                        done();
                    });
                } else {
                    expect(true).toEqual(true);
                    done();
                }
            });
            it('should return a status code of 401 when downloading in review objects', done => {
                setOptions(reviewURI, '');
                // If a learning object fitting the specified requirements exist, try to download it
                if (options.url) {
                    request(options).on('response', (response) => {
                        expect(response.statusCode).toBe(401);
                        done();
                    });
                } else {
                    expect(true).toEqual(true);
                    done();
                }
            });
            it('should return a status code of 401 when downloading proofing objects', done => {
                setOptions(proofingURI, '');
                // If a learning object fitting the specified requirements exist, try to download it
                if (options.url) {
                    request(options).on('response', (response) => {
                        expect(response.statusCode).toBe(401);
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
            setOptions(unreleasedURI, regToken);
            // If a learning object fitting the specified requirements exist, try to download it
            if (options.url) {
                request(options).on('response', (response) => {
                    expect(response.statusCode).toBe(403);
                    done();
                });
            } else {
                expect(true).toEqual(true);
                done();
            }
        });
        it('should return a status code of 200 when downloading released objects', done => {
            setOptions(releasedURI, regToken);
            request(options).on('response', (response) => {
                expect(response.statusCode).toBe(200);
                done();
            });
        });
        describe('and downloading an in review object', () => {
            it('should return a status code of 403 when downloading waiting objects', done => {
                setOptions(waitingURI, regToken);
                // If a learning object fitting the specified requirements exist, try to download it
                if (options.url) {
                    request(options).on('response', (response) => {
                        expect(response.statusCode).toBe(403);
                        done();
                    });
                } else {
                    expect(true).toEqual(true);
                    done();
                }
            });
            it('should return a status code of 403 when downloading in review objects', done => {
                setOptions(reviewURI, regToken);
                // If a learning object fitting the specified requirements exist, try to download it
                if (options.url) {
                    request(options).on('response', (response) => {
                        expect(response.statusCode).toBe(403);
                        done();
                    });
                } else {
                    expect(true).toEqual(true);
                    done();
                }
            });
            it('should return a status code of 403 when downloading proofing objects', done => {
                setOptions(proofingURI, regToken);
                // If a learning object fitting the specified requirements exist, try to download it
                if (options.url) {
                    request(options).on('response', (response) => {
                        expect(response.statusCode).toBe(403);
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
        describe('and the requester has Reviewer privileges', () => {
            it('should return a status code of 403 when downloading unreleased objects', done => {
                setOptions(unreleasedURI, reviewerToken);
                // If a learning object fitting the specified requirements exist, try to download it
                if (options.url) {
                    request(options).on('response', (response) => {
                        expect(response.statusCode).toBe(403);
                        done();
                    });
                } else {
                    expect(true).toEqual(true);
                    done();
                }
            });
            it('should return a status code of 200 when downloading released objects', done => {
                setOptions(releasedURI, reviewerToken);
                request(options).on('response', (response) => {
                    expect(response.statusCode).toBe(200);
                    done();
                });
            });
            describe('and downloading a in review object outside of their collection', () => {
                it('should return a status code of 403 when downloading waiting objects', done => {
                    setOptions(caeWaitingURI, reviewerToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            expect(response.statusCode).toBe(403);
                            done();
                        });
                    } else {
                        expect(true).toEqual(true);
                        done();
                    }
                });
                it('should return a status code of 403 when downloading in review objects', done => {
                    setOptions(caeReviewURI, reviewerToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            expect(response.statusCode).toBe(403);
                            done();
                        });
                    } else {
                        expect(true).toEqual(true);
                        done();
                    }
                });
                it('should return a status code of 403 when downloading proofing objects', done => {
                    setOptions(caeProofingURI, reviewerToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            expect(response.statusCode).toBe(403);
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
                    setOptions(waitingURI, reviewerToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            expect(response.statusCode).toBe(200);
                            done();
                        });
                    } else {
                        expect(true).toEqual(true);
                        done();
                    }
                });
                it('should return a status code of 200 when downloading in review objects', done => {
                    setOptions(reviewURI, reviewerToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            expect(response.statusCode).toBe(200);
                            done();
                        });
                    } else {
                        expect(true).toEqual(true);
                        done();
                    }
                });
                it('should return a status code of 200 when downloading proofing objects', done => {
                    setOptions(proofingURI, reviewerToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            expect(response.statusCode).toBe(200);
                            done();
                        });
                    } else {
                        expect(true).toEqual(true);
                        done();
                    }
                });
            });
        });
        describe('and the requester has Curator privileges', () => {
            it('should return a status code of 403 when downloading unreleased objects', done => {
                setOptions(unreleasedURI, curatorToken);
                // If a learning object fitting the specified requirements exist, try to download it
                if (options.url) {
                    request(options).on('response', (response) => {
                        expect(response.statusCode).toBe(403);
                        done();
                    });
                } else {
                    expect(true).toEqual(true);
                    done();
                }
            });
            it('should return a status code of 200 when downloading released objects', done => {
                setOptions(releasedURI, curatorToken);
                request(options).on('response', (response) => {
                    expect(response.statusCode).toBe(200);
                    done();
                });
            });
            describe('and downloading a in review object outside of their collection', () => {
                it('should return a status code of 403 when downloading waiting objects', done => {
                    setOptions(caeWaitingURI, curatorToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            expect(response.statusCode).toBe(403);
                            done();
                        });
                    } else {
                        expect(true).toEqual(true);
                        done();
                    }
                });
                it('should return a status code of 403 when downloading in review objects', done => {
                    setOptions(caeReviewURI, curatorToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            expect(response.statusCode).toBe(403);
                            done();
                        });
                    } else {
                        expect(true).toEqual(true);
                        done();
                    }
                });
                it('should return a status code of 403 when downloading proofing objects', done => {
                    setOptions(caeProofingURI, curatorToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            expect(response.statusCode).toBe(403);
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
                    setOptions(waitingURI, curatorToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            expect(response.statusCode).toBe(200);
                            done();
                        });
                    } else {
                        expect(true).toEqual(true);
                        done();
                    }
                });
                it('should return a status code of 200 when downloading in review objects', done => {
                    setOptions(reviewURI, curatorToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            expect(response.statusCode).toBe(200);
                            done();
                        });
                    } else {
                        expect(true).toEqual(true);
                        done();
                    }
                });
                it('should return a status code of 200 when downloading proofing objects', done => {
                    setOptions(proofingURI, curatorToken);
                    // If a learning object fitting the specified requirements exist, try to download it
                    if (options.url) {
                        request(options).on('response', (response) => {
                            expect(response.statusCode).toBe(200);
                            done();
                        });
                    } else {
                        expect(true).toEqual(true);
                        done();
                    }
                });
            });
        });
        describe('and the requester has Editor privileges', () => {
            it('should return a status code of 403 when downloading unreleased objects', done => {
                setOptions(unreleasedURI, editorToken);
                // If a learning object fitting the specified requirements exist, try to download it
                if (options.url) {
                    request(options).on('response', (response) => {
                        expect(response.statusCode).toBe(403);
                        done();
                    });
                } else {
                    expect(true).toEqual(true);
                    done();
                }
            });
            it('should return a status code of 200 when downloading released objects', done => {
                setOptions(releasedURI, editorToken);
                request(options).on('response', (response) => {
                    expect(response.statusCode).toBe(200);
                    done();
                });
            });
            describe('and downloading a in review object', () => {
                describe('and downloading waiting objects', () => {
                    it('should return a status code of 200 when downloading waiting objects from one collection', done => {
                        setOptions(waitingURI, editorToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
                                done();
                            });
                        } else {
                            expect(true).toEqual(true);
                            done();
                        }
                    });
                    it('should return a status code of 200 when downloading waiting objects from another collection', done => {
                        setOptions(caeWaitingURI, editorToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
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
                        setOptions(reviewURI, editorToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
                                done();
                            });
                        } else {
                            expect(true).toEqual(true);
                            done();
                        }
                    });
                    it('should return a status code of 200 when downloading in review objects from another collection', done => {
                        setOptions(caeReviewURI, editorToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
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
                        setOptions(proofingURI, editorToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
                                done();
                            });
                        } else {
                            expect(true).toEqual(true);
                            done();
                        }
                    });
                    it('should return a status code of 200 when downloading proofing objects from another collection', done => {
                        setOptions(caeProofingURI, editorToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
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
        describe('and the requester has Admin privileges', () => {
            it('should return a status code of 403 when downloading unreleased objects', done => {
                setOptions(unreleasedURI, adminToken);
                // If a learning object fitting the specified requirements exist, try to download it
                if (options.url) {
                    request(options).on('response', (response) => {
                        expect(response.statusCode).toBe(403);
                        done();
                    });
                } else {
                    expect(true).toEqual(true);
                    done();
                }
            });
            it('should return a status code of 200 when downloading released objects', done => {
                setOptions(releasedURI, adminToken);
                request(options).on('response', (response) => {
                    expect(response.statusCode).toBe(200);
                    done();
                });
            });
            describe('and downloading a in review object', () => {
                describe('and downloading waiting objects', () => {
                    it('should return a status code of 200 when downloading waiting objects from one collection', done => {
                        setOptions(waitingURI, adminToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
                                done();
                            });
                        } else {
                            expect(true).toEqual(true);
                            done();
                        }
                    });
                    it('should return a status code of 200 when downloading waiting objects from another collection', done => {
                        setOptions(caeWaitingURI, adminToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
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
                        setOptions(reviewURI, adminToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
                                done();
                            });
                        } else {
                            expect(true).toEqual(true);
                            done();
                        }
                    });
                    it('should return a status code of 200 when downloading in review objects from another collection', done => {
                        setOptions(caeReviewURI, adminToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
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
                        setOptions(proofingURI, adminToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
                                done();
                            });
                        } else {
                            expect(true).toEqual(true);
                            done();
                        }
                    });
                    it('should return a status code of 200 when downloading proofing objects from another collection', done => {
                        setOptions(caeProofingURI, adminToken);
                        // If a learning object fitting the specified requirements exist, try to download it
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
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