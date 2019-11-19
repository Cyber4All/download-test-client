describe("When testing downloads", () => {
    describe("and a unauthorized user", () => {
        it("should be unable to download unrealeased objects", () => {

        });
        it("should be unable to download released objects", () => {

        });
        describe("and be unable to download in review objects", () => {
            it("should not download Waiting objects", () => {

            });
            it("should not download Review objects", () => {

            });
            it("should not download Proofing objects", () => {
                
            });
        });
    });
    describe("and a signed in user with no privileges", () => {
        it("should be unable to download unreleased objects", () => {

        });
        it("should be able to download released objects", () => {

        });
        describe("and be unable to download in review objects", () => {
            it("should not download Waiting objects", () => {

            });
            it("should not download Review objects", () => {

            });
            it("should not download Proofing objects", () => {

            });
        });
    });
    describe("and a signed in user with privileges", () => {
        describe("and the user is a Reviewer", () => {
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