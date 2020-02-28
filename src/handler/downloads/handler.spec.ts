describe('When testDownloads is called', () => {
    describe('And there is a returned report from testing downloads', () => {
        describe('And there is a currently active issue in the system', () => {
            it('Should update the old issue with the new report', () => {

            });
        });
        describe(`And there isn't a currently active issue in the system`, () => {
            it('Should create a new issue with the report', () => {

            });
        });
    });
    describe(`And there isn't a returned report from testing downloads`, () => {
        describe(`But there is an active issue in the system`, () => {
            it('Should resolve the old issue', () => {

            });
        });
    });
});
