const request = require('request-promise');
import * as dotenv from "dotenv";
import { generateUserToken } from "../drivers/jwt/tokenManager";
import { regularUser, reviewerUser, curatorUser, editorUser, adminUser } from "../users";
import { MongoDB } from "../drivers/database/mongodb/mongodb";

dotenv.config(); // TODO move this to a higher up file

let regToken, reviewerToken, curatorToken, editorToken, adminToken;

const releasedURI = "https://api-gateway.clark.center/users/skaza/learning-objects/b1746fe9-9aee-4603-8e3a-bd7e25202b80/versions/0/bundle";
const waitingURI = "https://api-gateway.clark.center/users/skaza/learning-objects/d16f927f-244b-472e-8559-12e2cea6c78e/versions/0/bundle";
const proofingURI = "https://api-gateway.clark.center/users/bblairtaylor/learning-objects/cb7deb52-453a-4d14-9303-76dc4a106111/versions/0/bundle";

const options = {
    method: "GET",
    uri: "",
    headers: {
        'Content-Type': 'application/json',
        'Authorization': '',
    }
};

beforeAll(() => {
    regToken = generateUserToken(regularUser);
    reviewerToken = generateUserToken(reviewerUser);
    curatorToken = generateUserToken(curatorUser);
    editorToken = generateUserToken(editorUser);
    adminToken = generateUserToken(adminUser);
});

describe("When testing downloads", async () => {

    const db: MongoDB = await MongoDB.getInstance();

    describe("and a unauthorized user", () => {
        // Set authorization header to empty since no user is logged in
        options.headers.Authorization = "";

        it("should be unable to download unrealeased objects", () => {
            
        });
        it("should be unable to download released objects", async () => {
            options.uri = releasedURI;
            await expect(request(options)).rejects.toThrow();
        });
        describe("and be unable to download in review objects", () => {
            it("should not download Waiting objects", async () => {
                options.uri = waitingURI;
                await expect(request(options)).rejects.toThrow();
            });
            it("should not download Review objects", () => {

            });
            it("should not download Proofing objects", async () => {
                options.uri = proofingURI;
                await expect(request(options)).rejects.toThrow();
            });
        });
    });
    describe("and a signed in user with no privileges", () => {
        options.headers.Authorization = regToken;

        it("should be unable to download unreleased objects", () => {

        });
        it("should be able to download released objects", async () => {
            options.uri = releasedURI;
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
                await expect(request(options)).rejects.toThrow();
            });
            it("should not download Review objects", () => {

            });
            it("should not download Proofing objects", async () => {
                options.uri = proofingURI;
                await expect(request(options)).rejects.toThrow();
            });
        });
    });
    describe("and a signed in user with privileges", () => {
        describe("and the user is a Reviewer", () => {
            options.headers.Authorization = reviewerToken;

            it("should be unable to download unreleased objects", () => {

            });
            it("should be able to download released objects", () => {

            });
            describe("and the user is downloading a in review object outside of their collection", () => {
                it("should not download Waiting objects", () => {

                });
                it("should not download Review objects", () => {
    
                });
                it("should not download Proofing objects", () => {
    
                });
            });
            describe("and the user is downloading a in review object in their collection", () => {
                it("should download Waiting objects", () => {

                });
                it("should download Review objects", () => {
    
                });
                it("should download Proofing objects", () => {
    
                });
            });
        });
        describe("and the user is a Curator", () => {
            options.headers.Authorization = curatorToken;

            it("should be unable to download unreleased objects", () => {

            });
            it("should be able to download released objects", () => {

            });
            describe("and the user is downloading a in review object outside of their collection", () => {
                it("should not download Waiting objects", () => {

                });
                it("should not download Review objects", () => {
    
                });
                it("should not download Proofing objects", () => {
    
                });
            });
            describe("and the user is downloading a in review object in their collection", () => {
                it("should download Waiting objects", () => {

                });
                it("should download Review objects", () => {
    
                });
                it("should download Proofing objects", () => {
    
                });
            });
        });
        describe("and the user is a Editor", () => {
            options.headers.Authorization = editorToken;

            it("should be unable to download unreleased objects", () => {

            });
            it("should be able to download released objects", () => {

            });
            describe("and the user is downloading a in review object", () => {
                it("should download Waiting objects", () => {

                });
                it("should download Review objects", () => {

                });
                it("should download Proofing objects", () => {

                });
            });
        });
        describe("and the user is a Admin", () => {
            options.headers.Authorization = adminToken;

            it("should be unable to download unreleased objects", () => {

            });
            it("should be able to download released objects", () => {

            });
            describe("and the user is downloading a in review object", () => {
                it("should download Waiting objects", () => {

                });
                it("should download Review objects", () => {

                });
                it("should download Proofing objects", () => {
                    
                });
            });
        });
    });
});