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

function getDownloadURI({ object, username }) {
    if (object) {
        return `${ process.env.BASE_API_URL }/users/${ username }/learning-objects/${ object.cuid }/versions/${ object.version }/bundle`;
    } else {
        return undefined;
    }
}

function setOptions(uri: string, token: string) {
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

describe('When testing downloads', () => {

    describe('and a unauthorized user', () => {
        it('should be unable to download unrealeased objects', done => {
            setOptions(unreleasedURI, '');
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
        it('should be unable to download released objects', done => {
            setOptions(releasedURI, '');
            request(options).on('response', (response) => {
                expect(response.statusCode).toBe(401);
                done();
            });
        });
        describe('and be unable to download in review objects', () => {
            it('should not download Waiting objects', done => {
                setOptions(waitingURI, '');
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
            it('should not download Review objects', done => {
                setOptions(reviewURI, '');
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
            it('should not download Proofing objects', done => {
                setOptions(proofingURI, '');
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
    describe('and a signed in user with no privileges', () => {
        it('should be unable to download unreleased objects', done => {
            setOptions(unreleasedURI, regToken);
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
        it('should be able to download released objects', done => {
            setOptions(releasedURI, regToken);
            request(options).on('response', (response) => {
                expect(response.statusCode).toBe(200);
                done();
            });
        });
        describe('and be unable to download in review objects', () => {
            it('should not download Waiting objects', done => {
                setOptions(waitingURI, regToken);
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
            it('should not download Review objects', done => {
                setOptions(reviewURI, regToken);
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
            it('should not download Proofing objects', done => {
                setOptions(proofingURI, regToken);
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
    describe('and a signed in user with privileges', () => {
        describe('and the user is a Reviewer', () => {
            it('should be unable to download unreleased objects', done => {
                setOptions(unreleasedURI, reviewerToken);
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
            it('should be able to download released objects', done => {
                setOptions(releasedURI, reviewerToken);
                request(options).on('response', (response) => {
                    expect(response.statusCode).toBe(200);
                    done();
                });
            });
            describe('and the user is downloading a in review object outside of their collection', () => {
                it('should not download Waiting objects', done => {
                    setOptions(caeWaitingURI, reviewerToken);
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
                it('should not download Review objects', done => {
                    setOptions(caeReviewURI, reviewerToken);
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
                it('should not download Proofing objects', done => {
                    setOptions(caeProofingURI, reviewerToken);
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
            describe('and the user is downloading a in review object in their collection', () => {
                it('should download Waiting objects', done => {
                    setOptions(waitingURI, reviewerToken);
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
                it('should download Review objects', done => {
                    setOptions(reviewURI, reviewerToken);
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
                it('should download Proofing objects', done => {
                    setOptions(proofingURI, reviewerToken);
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
        describe('and the user is a Curator', () => {
            it('should be unable to download unreleased objects', () => {
                setOptions(unreleasedURI, curatorToken);
                if (options.url) {
                    request(options).on('response', (response) => {
                        expect(response.statusCode).toBe(403);
                    });
                } else {
                    expect(true).toEqual(true);
                }
            });
            it('should be able to download released objects', () => {
                setOptions(releasedURI, curatorToken);
                request(options).on('response', (response) => {
                    expect(response.statusCode).toBe(200);
                });
            });
            describe('and the user is downloading a in review object outside of their collection', () => {
                it('should not download Waiting objects', () => {
                    setOptions(caeWaitingURI, curatorToken);
                    if (options.url) {
                        request(options).on('response', (response) => {
                            expect(response.statusCode).toBe(403);
                        });
                    } else {
                        expect(true).toEqual(true);
                    }
                });
                it('should not download Review objects', () => {
                    setOptions(caeReviewURI, curatorToken);
                    if (options.url) {
                        request(options).on('response', (response) => {
                            expect(response.statusCode).toBe(403);
                        });
                    } else {
                        expect(true).toEqual(true);
                    }
                });
                it('should not download Proofing objects', () => {
                    setOptions(caeProofingURI, curatorToken);
                    if (options.url) {
                        request(options).on('response', (response) => {
                            expect(response.statusCode).toBe(403);
                        });
                    } else {
                        expect(true).toEqual(true);
                    }
                });
            });
            describe('and the user is downloading a in review object in their collection', () => {
                it('should download Waiting objects', () => {
                    setOptions(waitingURI, curatorToken);
                    if (options.url) {
                        request(options).on('response', (response) => {
                            expect(response.statusCode).toBe(200);
                        });
                    } else {
                        expect(true).toEqual(true);
                    }
                });
                it('should download Review objects', () => {
                    setOptions(reviewURI, curatorToken);
                    if (options.url) {
                        request(options).on('response', (response) => {
                            expect(response.statusCode).toBe(200);
                        });
                    } else {
                        expect(true).toEqual(true);
                    }
                });
                it('should download Proofing objects', () => {
                    setOptions(proofingURI, curatorToken);
                    if (options.url) {
                        request(options).on('response', (response) => {
                            expect(response.statusCode).toBe(200);
                        });
                    } else {
                        expect(true).toEqual(true);
                    }
                });
            });
        });
        describe('and the user is a Editor', () => {
            it('should be unable to download unreleased objects', () => {
                setOptions(unreleasedURI, editorToken);
                if (options.url) {
                    request(options).on('response', (response) => {
                        expect(response.statusCode).toBe(403);
                    });
                } else {
                    expect(true).toEqual(true);
                }
            });
            it('should be able to download released objects', () => {
                setOptions(releasedURI, editorToken);
                request(options).on('response', (response) => {
                    expect(response.statusCode).toBe(200);
                });
            });
            describe('and the user is downloading a in review object', () => {
                describe('and the user downloads Waiting objects', () => {
                    it('should download a object in one collection', () => {
                        setOptions(waitingURI, editorToken);
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
                            });
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                    it('should download a object in another collection', () => {
                        setOptions(caeWaitingURI, editorToken);
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
                            });
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                });
                describe('and the user downloads Review objects', () => {
                    it('should download a object in one collection', () => {
                        setOptions(reviewURI, editorToken);
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
                            });
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                    it('should download a object in another collection', () => {
                        setOptions(caeReviewURI, editorToken);
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
                            });
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                });
                describe('and the user downloads Proofing objects', () => {
                    it('should download a object in one collection', () => {
                        setOptions(proofingURI, editorToken);
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
                            });
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                    it('should download a object in another collection', () => {
                        setOptions(caeProofingURI, editorToken);
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
                            });
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                });
            });
        });
        describe('and the user is a Admin', () => {
            it('should be unable to download unreleased objects', () => {
                setOptions(unreleasedURI, adminToken);
                if (options.url) {
                    request(options).on('response', (response) => {
                        expect(response.statusCode).toBe(403);
                    });
                } else {
                    expect(true).toEqual(true);
                }
            });
            it('should be able to download released objects', () => {
                setOptions(releasedURI, adminToken);
                request(options).on('response', (response) => {
                    expect(response.statusCode).toBe(200);
                });
            });
            describe('and the user is downloading a in review object', () => {
                describe('and the user downloads Waiting objects', () => {
                    it('should download a object in one collection', () => {
                        setOptions(waitingURI, adminToken);
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
                            });
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                    it('should download a object in another collection', () => {
                        setOptions(caeWaitingURI, adminToken);
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
                            });
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                });
                describe('and the user downloads Review objects', () => {
                    it('should download a object in one collection', () => {
                        setOptions(reviewURI, adminToken);
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
                            });
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                    it('should download a object in another collection', () => {
                        setOptions(caeReviewURI, adminToken);
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
                            });
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                });
                describe('and the user downloads Proofing objects', () => {
                    it('should download a object in one collection', () => {
                        setOptions(proofingURI, adminToken);
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
                            });
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                    it('should download a object in another collection', () => {
                        setOptions(caeProofingURI, adminToken);
                        if (options.url) {
                            request(options).on('response', (response) => {
                                expect(response.statusCode).toBe(200);
                            });
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                });
            });
        });
    });
});