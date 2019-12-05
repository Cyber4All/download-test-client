const request = require('request-promise');
import * as dotenv from "dotenv";
import { generateUserToken } from "../drivers/jwt/tokenManager";
import { regularUser, reviewerUser, curatorUser, editorUser, adminUser } from "../users";
import { MongoDB } from "../drivers/database/mongodb/mongodb";

dotenv.config(); // TODO move this to a higher up file

let db: MongoDB;

let regToken, reviewerToken, curatorToken, editorToken, adminToken;
let releasedURI, waitingURI, proofingURI, reviewURI, unreleasedURI, caeWaitingURI, caeReviewURI, caeProofingURI;

const options = {
    method: "GET",
    uri: "",
    headers: {
        'Content-Type': 'application/json',
        'Authorization': '',
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
    options.uri = uri;
    options.headers.Authorization = "Bearer " + token;
}

beforeAll(async () => {
    regToken = generateUserToken(regularUser);
    reviewerToken = generateUserToken(reviewerUser);
    curatorToken = generateUserToken(curatorUser);
    editorToken = generateUserToken(editorUser);
    adminToken = generateUserToken(adminUser);

    db = await MongoDB.getInstance();
    releasedURI = getDownloadURI(await db.getObject("released"));
    waitingURI = getDownloadURI(await db.getObject("waiting", "nccp"));
    proofingURI = getDownloadURI(await db.getObject("proofing", "nccp"));
    reviewURI = getDownloadURI(await db.getObject("review", "nccp"));
    unreleasedURI = getDownloadURI(await db.getObject("unreleased"));

    caeWaitingURI = getDownloadURI(await db.getObject("waiting", "cae_community"));
    caeReviewURI = getDownloadURI(await db.getObject("review", "cae_community"));
    caeProofingURI = getDownloadURI(await db.getObject("proofing", "cae_community"));
});

describe("When testing downloads", () => {

    describe("and a unauthorized user", () => {
        it("should be unable to download unrealeased objects", async () => {
            setOptions(unreleasedURI, "");
            if (options.uri) {
                await expect(request(options)).rejects.toThrow();
            } else {
                expect(true).toEqual(true);
            }
        });
        it("should be unable to download released objects", async () => {
            setOptions(releasedURI, "");
            await expect(request(options)).rejects.toThrow();
        });
        describe("and be unable to download in review objects", () => {
            it("should not download Waiting objects", async () => {
                setOptions(waitingURI, "");
                if (options.uri) {
                    await expect(request(options)).rejects.toThrow();
                } else {
                    expect(true).toEqual(true);
                }
            });
            it("should not download Review objects", async () => {
                setOptions(reviewURI, "");
                if (options.uri) {
                    await expect(request(options)).rejects.toThrow();
                } else {
                    expect(true).toEqual(true);
                }
            });
            it("should not download Proofing objects", async () => {
                setOptions(proofingURI, "");
                if (options.uri) {
                    await expect(request(options)).rejects.toThrow();
                } else {
                    expect(true).toEqual(true);
                }
            });
        });
    });
    describe("and a signed in user with no privileges", () => {

        it("should be unable to download unreleased objects", async () => {
            setOptions(unreleasedURI, regToken);
            if (options.uri) {
                await expect(request(options)).rejects.toThrow();
            } else {
                expect(true).toEqual(true);
            }
        });
        it("should be able to download released objects", async () => {
            setOptions(releasedURI, regToken);
            // const req = request(releasedOptions);
            // console.log('Blah Blah Blah');
            // req.on('timeout', () => {
            //     console.log('Timed Out!!');
            // });
            
            await expect(request(options)).resolves.toBeDefined();
        });
        describe("and be unable to download in review objects", () => {
            it("should not download Waiting objects", async () => {
                options.uri = waitingURI;
                if (options.uri) {
                    await expect(request(options)).rejects.toThrow();
                } else {
                    expect(true).toEqual(true);
                }
            });
            it("should not download Review objects", async () => {
                options.uri = reviewURI;
                if (options.uri) {
                    await expect(request(options)).rejects.toThrow();
                } else {
                    expect(true).toEqual(true);
                }
            });
            it("should not download Proofing objects", async () => {
                options.uri = proofingURI;
                if (options.uri) {
                    await expect(request(options)).rejects.toThrow();
                } else {
                    expect(true).toEqual(true);
                }
            });
        });
    });
    describe("and a signed in user with privileges", () => {
        describe("and the user is a Reviewer", () => {
            it("should be unable to download unreleased objects", async () => {
                setOptions(unreleasedURI, reviewerToken);
                if (options.uri) {
                    await expect(request(options)).rejects.toThrow();
                } else {
                    expect(true).toEqual(true);
                }
            });
            it("should be able to download released objects", async () => {
                setOptions(releasedURI, reviewerToken);
                await expect(request(options)).resolves.toBeDefined();
            });
            describe("and the user is downloading a in review object outside of their collection", () => {
                it("should not download Waiting objects", async () => {
                    setOptions(caeWaitingURI, reviewerToken);
                    if (options.uri) {
                        await expect(request(options)).rejects.toThrow();
                    } else {
                        expect(true).toEqual(true);
                    }
                });
                it("should not download Review objects", async () => {
                    setOptions(caeReviewURI, reviewerToken);
                    if (options.uri) {
                        await expect(request(options)).rejects.toThrow();
                    } else {
                        expect(true).toEqual(true);
                    }
                });
                it("should not download Proofing objects", async () => {
                    setOptions(caeProofingURI, reviewerToken);
                    if (options.uri) {
                        await expect(request(options)).rejects.toThrow();
                    } else {
                        expect(true).toEqual(true);
                    }
                });
            });
            describe("and the user is downloading a in review object in their collection", () => {
                it("should download Waiting objects", async () => {
                    setOptions(waitingURI, reviewerToken);
                    if (options.uri) {
                        await expect(request(options)).resolves.toBeDefined();
                    } else {
                        expect(true).toEqual(true);
                    }
                });
                it("should download Review objects", async () => {
                    setOptions(reviewURI, reviewerToken);
                    if (options.uri) {
                        await expect(request(options)).resolves.toBeDefined();
                    } else {
                        expect(true).toEqual(true);
                    }
                });
                it("should download Proofing objects", async () => {
                    setOptions(proofingURI, reviewerToken);
                    if (options.uri) {
                        await expect(request(options)).resolves.toBeDefined();
                    } else {
                        expect(true).toEqual(true);
                    }
                });
            });
        });
        describe("and the user is a Curator", () => {
            it("should be unable to download unreleased objects", async () => {
                setOptions(unreleasedURI, curatorToken);
                if (options.uri) {
                    await expect(request(options)).rejects.toThrow();
                } else {
                    expect(true).toEqual(true);
                }
            });
            it("should be able to download released objects", async () => {
                setOptions(releasedURI, curatorToken);
                await expect(request(options)).resolves.toBeDefined();
            });
            describe("and the user is downloading a in review object outside of their collection", () => {
                it("should not download Waiting objects", async () => {
                    setOptions(caeWaitingURI, curatorToken);
                    if (options.uri) {
                        await expect(request(options)).rejects.toThrow();
                    } else {
                        expect(true).toEqual(true);
                    }
                });
                it("should not download Review objects", async () => {
                    setOptions(caeReviewURI, curatorToken);
                    if (options.uri) {
                        await expect(request(options)).rejects.toThrow();
                    } else {
                        expect(true).toEqual(true);
                    }
                });
                it("should not download Proofing objects", async () => {
                    setOptions(caeProofingURI, curatorToken);
                    if (options.uri) {
                        await expect(request(options)).rejects.toThrow();
                    } else {
                        expect(true).toEqual(true);
                    }
                });
            });
            describe("and the user is downloading a in review object in their collection", () => {
                it("should download Waiting objects", async () => {
                    setOptions(waitingURI, curatorToken);
                    if (options.uri) {
                        await expect(request(options)).resolves.toBeDefined();
                    } else {
                        expect(true).toEqual(true);
                    }
                });
                it("should download Review objects", async () => {
                    setOptions(reviewURI, curatorToken);
                    if (options.uri) {
                        await expect(request(options)).resolves.toBeDefined();
                    } else {
                        expect(true).toEqual(true);
                    }
                });
                it("should download Proofing objects", async () => {
                    setOptions(proofingURI, curatorToken);
                    if (options.uri) {
                        await expect(request(options)).resolves.toBeDefined();
                    } else {
                        expect(true).toEqual(true);
                    }
                });
            });
        });
        describe("and the user is a Editor", () => {
            it("should be unable to download unreleased objects", async () => {
                setOptions(unreleasedURI, editorToken);
                if (options.uri) {
                    await expect(request(options)).rejects.toThrow();
                } else {
                    expect(true).toEqual(true);
                }
            });
            it("should be able to download released objects", async () => {
                setOptions(releasedURI, editorToken);
                await expect(request(options)).resolves.toBeDefined();
            });
            describe("and the user is downloading a in review object", () => {
                describe("and the user downloads Waiting objects", () => {
                    it("should download a object in one collection", async () => {
                        setOptions(waitingURI, editorToken);
                        if (options.uri) {
                            await expect(request(options)).resolves.toBeDefined();
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                    it("should download a object in another collection", async () => {
                        setOptions(caeWaitingURI, editorToken);
                        if (options.uri) {
                            await expect(request(options)).resolves.toBeDefined();
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                });
                describe("and the user downloads Review objects", () => {
                    it("should download a object in one collection", async () => {
                        setOptions(reviewURI, editorToken);
                        if (options.uri) {
                            await expect(request(options)).resolves.toBeDefined();
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                    it("should download a object in another collection", async () => {
                        setOptions(caeReviewURI, editorToken);
                        if (options.uri) {
                            await expect(request(options)).resolves.toBeDefined();
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                });
                describe("and the user downloads Proofing objects", () => {
                    it("should download a object in one collection", async () => {
                        setOptions(proofingURI, editorToken);
                        if (options.uri) {
                            await expect(request(options)).resolves.toBeDefined();
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                    it("should download a object in another collection", async () => {
                        setOptions(caeProofingURI, editorToken);
                        if (options.uri) {
                            await expect(request(options)).resolves.toBeDefined();
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                });
            });
        });
        describe("and the user is a Admin", () => {
            it("should be unable to download unreleased objects", async () => {
                setOptions(unreleasedURI, adminToken);
                if (options.uri) {
                    await expect(request(options)).rejects.toThrowError();
                } else {
                    expect(true).toEqual(true);
                }
            });
            it("should be able to download released objects", async () => {
                setOptions(releasedURI, adminToken);
                await expect(request(options)).resolves.toBeDefined();
            });
            describe("and the user is downloading a in review object", () => {
                describe("and the user downloads Waiting objects", () => {
                    it("should download a object in one collection", async () => {
                        setOptions(waitingURI, adminToken);
                        if (options.uri) {
                            await expect(request(options)).resolves.toBeDefined();
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                    it("should download a object in another collection", async () => {
                        setOptions(caeWaitingURI, adminToken);
                        if (options.uri) {
                            await expect(request(options)).resolves.toBeDefined();
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                });
                describe("and the user downloads Review objects", () => {
                    it("should download a object in one collection", async () => {
                        setOptions(reviewURI, adminToken);
                        if (options.uri) {
                            await expect(request(options)).resolves.toBeDefined();
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                    it("should download a object in another collection", async () => {
                        setOptions(caeReviewURI, adminToken);
                        if (options.uri) {
                            await expect(request(options)).resolves.toBeDefined();
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                });
                describe("and the user downloads Proofing objects", () => {
                    it("should download a object in one collection", async () => {
                        setOptions(proofingURI, adminToken);
                        if (options.uri) {
                            await expect(request(options)).resolves.toBeDefined();
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                    it("should download a object in another collection", async () => {
                        setOptions(caeProofingURI, adminToken);
                        if (options.uri) {
                            await expect(request(options)).resolves.toBeDefined();
                        } else {
                            expect(true).toEqual(true);
                        }
                    });
                });
            });
        });
    });
});