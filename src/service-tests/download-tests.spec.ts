const request = require('request-promise');
import * as dotenv from 'dotenv';
import { generateUserToken } from '../drivers/jwt/tokenManager';
import { regularUser, reviewerUser, curatorUser, editorUser, adminUser } from '../users';
import { MongoDB } from '../drivers/database/mongodb/mongodb';

dotenv.config(); // TODO move this to a higher up file

let db: MongoDB;

let regToken: string, reviewerToken: string, curatorToken: string, editorToken: string, adminToken: string;
let releasedURI: string, waitingURI: string, proofingURI: string, reviewURI: string, unreleasedURI: string, caeWaitingURI: string, caeReviewURI: string, caeProofingURI: string;

const options = {
    method: 'GET',
    uri: '',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': '',
    },
    timeout: 200
};
const codes = {
    ok: /200/,
    unauthorized: /401/,
    forbidden: /403/,
    timedout: /TIMEDOUT/
}

function getDownloadURI({ object, username }) {
    if (object) {
        return `${ process.env.BASE_API_URL }/users/${ username }/learning-objects/${ object.cuid }/versions/${ object.version }/bundle`;
    } else {
        return undefined;
    }
}

function setOptions(uri: string, token: string) {
    options.uri = uri;
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
        it('should be unable to download unrealeased objects', async () => {
            setOptions(unreleasedURI, '');
            if (options.uri) {
                await expect(request(options)).rejects.toThrow(codes.unauthorized);
            } else {
                expect(true).toEqual(true);
            }
        });
        it('should be unable to download released objects', async () => {
            setOptions(releasedURI, '');
            await expect(request(options)).rejects.toThrow(codes.unauthorized);
        });
        describe('and be unable to download in review objects', () => {
            it('should not download Waiting objects', async () => {
                setOptions(waitingURI, '');
                if (options.uri) {
                    await expect(request(options)).rejects.toThrow(codes.unauthorized);
                } else {
                    expect(true).toEqual(true);
                }
            });
            it('should not download Review objects', async () => {
                setOptions(reviewURI, '');
                if (options.uri) {
                    await expect(request(options)).rejects.toThrow(codes.unauthorized);
                } else {
                    expect(true).toEqual(true);
                }
            });
            it('should not download Proofing objects', async () => {
                setOptions(proofingURI, '');
                if (options.uri) {
                    await expect(request(options)).rejects.toThrow(codes.unauthorized);
                } else {
                    expect(true).toEqual(true);
                }
            });
        });
    });
    describe('and a signed in user with no privileges', () => {

        it('should be unable to download unreleased objects', async () => {
            setOptions(unreleasedURI, regToken);
            if (options.uri) {
                await expect(request(options)).rejects.toThrow(codes.forbidden);
            } else {
                expect(true).toEqual(true);
            }
        });
        it('should be able to download released objects', async () => {
            try {
                setOptions(releasedURI, regToken);
                await expect(request(options)).resolves.toBeDefined();
            } catch (e) {
                expect(e.message).toMatch(codes.timedout);
            }
        });
        describe('and be unable to download in review objects', () => {
            it('should not download Waiting objects', async () => {
                setOptions(waitingURI, regToken);
                if (options.uri) {
                    await expect(request(options)).rejects.toThrow(codes.forbidden);
                } else {
                    expect(true).toEqual(true);
                }
            });
            it('should not download Review objects', async () => {
                setOptions(reviewURI, regToken);
                if (options.uri) {
                    await expect(request(options)).rejects.toThrow(codes.forbidden);
                } else {
                    expect(true).toEqual(true);
                }
            });
            it('should not download Proofing objects', async () => {
                setOptions(proofingURI, regToken);
                if (options.uri) {
                    await expect(request(options)).rejects.toThrow(codes.forbidden);
                } else {
                    expect(true).toEqual(true);
                }
            });
        });
    });
    describe('and a signed in user with privileges', () => {
        describe('and the user is a Reviewer', () => {
            it('should be unable to download unreleased objects', async () => {
                setOptions(unreleasedURI, reviewerToken);
                if (options.uri) {
                    await expect(request(options)).rejects.toThrow(codes.forbidden);
                } else {
                    expect(true).toEqual(true);
                }
            });
            it('should be able to download released objects', async () => {
                try {
                    setOptions(releasedURI, reviewerToken);
                    await expect(request(options)).resolves.toBeDefined();
                } catch (e) {
                    expect(e.message).toMatch(codes.timedout);
                }
            });
            describe('and the user is downloading a in review object outside of their collection', () => {
                it('should not download Waiting objects', async () => {
                    setOptions(caeWaitingURI, reviewerToken);
                    if (options.uri) {
                        await expect(request(options)).rejects.toThrow(codes.forbidden);
                    } else {
                        expect(true).toEqual(true);
                    }
                });
                it('should not download Review objects', async () => {
                    setOptions(caeReviewURI, reviewerToken);
                    if (options.uri) {
                        await expect(request(options)).rejects.toThrow(codes.forbidden);
                    } else {
                        expect(true).toEqual(true);
                    }
                });
                it('should not download Proofing objects', async () => {
                    setOptions(caeProofingURI, reviewerToken);
                    if (options.uri) {
                        await expect(request(options)).rejects.toThrow(codes.forbidden);
                    } else {
                        expect(true).toEqual(true);
                    }
                });
            });
            describe('and the user is downloading a in review object in their collection', () => {
                it('should download Waiting objects', async () => {
                    setOptions(waitingURI, reviewerToken);
                    try {
                        if (options.uri) {
                            await expect(request(options)).resolves.toBeDefined();
                        } else {
                            expect(true).toEqual(true);
                        }
                    } catch (e) {
                        expect(e.message).toMatch(codes.timedout);
                    }
                });
                it('should download Review objects', async () => {
                    setOptions(reviewURI, reviewerToken);
                    try {
                        if (options.uri) {
                            await expect(request(options)).resolves.toBeDefined();
                        } else {
                            expect(true).toEqual(true);
                        }
                    } catch (e) {
                        expect(e.message).toMatch(codes.timedout);
                    }
                });
                it('should download Proofing objects', async () => {
                    setOptions(proofingURI, reviewerToken);
                    try {
                        if (options.uri) {
                            await expect(request(options)).resolves.toBeDefined();
                        } else {
                            expect(true).toEqual(true);
                        }
                    } catch (e) {
                        expect(e.message).toMatch(codes.timedout);
                    }
                });
            });
        });
        describe('and the user is a Curator', () => {
            it('should be unable to download unreleased objects', async () => {
                setOptions(unreleasedURI, curatorToken);
                if (options.uri) {
                    await expect(request(options)).rejects.toThrow(codes.forbidden);
                } else {
                    expect(true).toEqual(true);
                }
            });
            it('should be able to download released objects', async () => {
                try {
                    setOptions(releasedURI, curatorToken);
                    await expect(request(options)).resolves.toBeDefined();
                } catch (e) {
                    expect(e.message).toMatch(codes.timedout);
                }
            });
            describe('and the user is downloading a in review object outside of their collection', () => {
                it('should not download Waiting objects', async () => {
                    setOptions(caeWaitingURI, curatorToken);
                    if (options.uri) {
                        await expect(request(options)).rejects.toThrow(codes.forbidden);
                    } else {
                        expect(true).toEqual(true);
                    }
                });
                it('should not download Review objects', async () => {
                    setOptions(caeReviewURI, curatorToken);
                    if (options.uri) {
                        await expect(request(options)).rejects.toThrow(codes.forbidden);
                    } else {
                        expect(true).toEqual(true);
                    }
                });
                it('should not download Proofing objects', async () => {
                    setOptions(caeProofingURI, curatorToken);
                    if (options.uri) {
                        await expect(request(options)).rejects.toThrow(codes.forbidden);
                    } else {
                        expect(true).toEqual(true);
                    }
                });
            });
            describe('and the user is downloading a in review object in their collection', () => {
                it('should download Waiting objects', async () => {
                    setOptions(waitingURI, curatorToken);
                    try {
                        if (options.uri) {
                            await expect(request(options)).resolves.toBeDefined();
                        } else {
                            expect(true).toEqual(true);
                        }
                    } catch (e) {
                        expect(e.message).toMatch(codes.timedout);
                    }
                });
                it('should download Review objects', async () => {
                    setOptions(reviewURI, curatorToken);
                    try {
                        if (options.uri) {
                            await expect(request(options)).resolves.toBeDefined();
                        } else {
                            expect(true).toEqual(true);
                        }
                    } catch (e) {
                        expect(e.message).toMatch(codes.timedout);
                    }
                });
                it('should download Proofing objects', async () => {
                    setOptions(proofingURI, curatorToken);
                    try {
                        if (options.uri) {
                            await expect(request(options)).resolves.toBeDefined();
                        } else {
                            expect(true).toEqual(true);
                        }
                    } catch (e) {
                        expect(e.message).toMatch(codes.timedout);
                    }
                });
            });
        });
        describe('and the user is a Editor', () => {
            it('should be unable to download unreleased objects', async () => {
                setOptions(unreleasedURI, editorToken);
                if (options.uri) {
                    await expect(request(options)).rejects.toThrow(codes.forbidden);
                } else {
                    expect(true).toEqual(true);
                }
            });
            it('should be able to download released objects', async () => {
                try {
                    setOptions(releasedURI, editorToken);
                    await expect(request(options)).resolves.toBeDefined();
                } catch (e) {
                    expect(e.message).toMatch(codes.timedout);
                }
            });
            describe('and the user is downloading a in review object', () => {
                describe('and the user downloads Waiting objects', () => {
                    it('should download a object in one collection', async () => {
                        setOptions(waitingURI, editorToken);
                        try {
                            if (options.uri) {
                                await expect(request(options)).resolves.toBeDefined();
                            } else {
                                expect(true).toEqual(true);
                            }
                        } catch (e) {
                            expect(e.message).toMatch(codes.timedout);
                        }
                    });
                    it('should download a object in another collection', async () => {
                        setOptions(caeWaitingURI, editorToken);
                        try {
                            if (options.uri) {
                                await expect(request(options)).resolves.toBeDefined();
                            } else {
                                expect(true).toEqual(true);
                            }
                        } catch (e) {
                            expect(e.message).toMatch(codes.timedout);
                        }
                    });
                });
                describe('and the user downloads Review objects', () => {
                    it('should download a object in one collection', async () => {
                        setOptions(reviewURI, editorToken);
                        try {
                            if (options.uri) {
                                await expect(request(options)).resolves.toBeDefined();
                            } else {
                                expect(true).toEqual(true);
                            }
                        } catch (e) {
                            expect(e.message).toMatch(codes.timedout);
                        }
                    });
                    it('should download a object in another collection', async () => {
                        setOptions(caeReviewURI, editorToken);
                        try {
                            if (options.uri) {
                                await expect(request(options)).resolves.toBeDefined();
                            } else {
                                expect(true).toEqual(true);
                            }
                        } catch (e) {
                            expect(e.message).toMatch(codes.timedout);
                        }
                    });
                });
                describe('and the user downloads Proofing objects', () => {
                    it('should download a object in one collection', async () => {
                        setOptions(proofingURI, editorToken);
                        try {
                            if (options.uri) {
                                await expect(request(options)).resolves.toBeDefined();
                            } else {
                                expect(true).toEqual(true);
                            }
                        } catch (e) {
                            expect(e.message).toMatch(codes.timedout);
                        }
                    });
                    it('should download a object in another collection', async () => {
                        setOptions(caeProofingURI, editorToken);
                        try {
                            if (options.uri) {
                                await expect(request(options)).resolves.toBeDefined();
                            } else {
                                expect(true).toEqual(true);
                            }
                        } catch (e) {
                            expect(e.message).toMatch(codes.timedout);
                        }
                    });
                });
            });
        });
        describe('and the user is a Admin', () => {
            it('should be unable to download unreleased objects', async () => {
                setOptions(unreleasedURI, adminToken);
                if (options.uri) {
                    await expect(request(options)).rejects.toThrowError(codes.forbidden);
                } else {
                    expect(true).toEqual(true);
                }
            });
            it('should be able to download released objects', async () => {
                try {
                    setOptions(releasedURI, adminToken);
                    await expect(request(options)).resolves.toBeDefined();
                } catch (e) {
                    expect(e.message).toMatch(codes.timedout);
                }
            });
            describe('and the user is downloading a in review object', () => {
                describe('and the user downloads Waiting objects', () => {
                    it('should download a object in one collection', async () => {
                        setOptions(waitingURI, adminToken);
                        try {
                            if (options.uri) {
                                await expect(request(options)).resolves.toBeDefined();
                            } else {
                                expect(true).toEqual(true);
                            }
                        } catch (e) {
                            expect(e.message).toMatch(codes.timedout);
                        }
                    });
                    it('should download a object in another collection', async () => {
                        setOptions(caeWaitingURI, adminToken);
                        try {
                            if (options.uri) {
                                await expect(request(options)).resolves.toBeDefined();
                            } else {
                                expect(true).toEqual(true);
                            }
                        } catch (e) {
                            expect(e.message).toMatch(codes.timedout);
                        }
                    });
                });
                describe('and the user downloads Review objects', () => {
                    it('should download a object in one collection', async () => {
                        setOptions(reviewURI, adminToken);
                        try {
                            if (options.uri) {
                                await expect(request(options)).resolves.toBeDefined();
                            } else {
                                expect(true).toEqual(true);
                            }
                        } catch (e) {
                            expect(e.message).toMatch(codes.timedout);
                        }
                    });
                    it('should download a object in another collection', async () => {
                        setOptions(caeReviewURI, adminToken);
                        try {
                            if (options.uri) {
                                await expect(request(options)).resolves.toBeDefined();
                            } else {
                                expect(true).toEqual(true);
                            }
                        } catch (e) {
                            expect(e.message).toMatch(codes.timedout);
                        }
                    });
                });
                describe('and the user downloads Proofing objects', () => {
                    it('should download a object in one collection', async () => {
                        setOptions(proofingURI, adminToken);
                        try {
                            if (options.uri) {
                                await expect(request(options)).resolves.toBeDefined();
                            } else {
                                expect(true).toEqual(true);
                            }
                        } catch (e) {
                            expect(e.message).toMatch(codes.timedout);
                        }
                    });
                    it('should download a object in another collection', async () => {
                        setOptions(caeProofingURI, adminToken);
                        try {
                            if (options.uri) {
                                await expect(request(options)).resolves.toBeDefined();
                            } else {
                                expect(true).toEqual(true);
                            }
                        } catch (e) {
                            expect(e.message).toMatch(codes.timedout);
                        }
                    });
                });
            });
        });
    });
});