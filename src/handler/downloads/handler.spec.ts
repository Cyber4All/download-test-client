describe('When testDownloads is called', () => {
    describe('and the test command returns a code other than 0', () => {
        describe('and there is an active issue', () => {
            describe('and the active issue is different than the issue that was just discovered', () => {
                describe('and the test-result.json file contains one failed test case that pertains to admin users', () => {
                    it('should call updateActiveIssue with accessGroups set to admin and issues set to the failed test case title', () => {

                    });
                });
                describe('and the test-result.json file contains one failed test case that pertains to editor users', () => {
                    it('should call updateActiveIssue with accessGroups set to editor and issues set to the failed test case title', () => {

                    });
                });
                describe('and the test-result.json file contains one failed test case that pertains to curator users', () => {
                    it('should call updateActiveIssue with accessGroups set to curator and issues set to the failed test case title', () => {

                    });
                });
                describe('and the test-result.json file contains one failed test case that pertains to reviewer users', () => {
                    it('should call updateActiveIssue with accessGroups set to reviewer and issues set to the failed test case title', () => {

                    });
                });
                describe('and the test-result.json file contains three failed test cases. Two pertaining to admin users and one pertaining to editor users', () => {
                    it('should call updateActiveIssue with accessGroups set to ["admin", "editor"] and issues set to all of the failed test case titles', () => {

                    });
                });
            });
            describe('and the active issue is the same as the issue that was just discovered', () => {
                it('should resolve without performing any writes to the database', () => {

                });
            });
        });
        describe('and there is not an active issue', () => {
            describe('and the test-result.json file contains one failed test case that pertains to admin users', () => {
                it('should call createNewIssue with accessGroups set to admin and issues set to all of the failed test case titles', () => {

                });
            });
            describe('and the test-result.json file contains one failed test case that pertains to editor users', () => {
                it('should call createNewIssue with accessGroups set to editor and issues set to all of the failed test case titles', () => {

                });
            });
            describe('and the test-result.json file contains one failed test case that pertains to curator users', () => {
                it('should call createNewIssue with accessGroups set to curator and issues set to all of the failed test case titles', () => {

                });
            });
            describe('and the test-result.json file contains one failed test case that pertains to reviewer users', () => {
                it('should call createNewIssue with accessGroups set to reviewer and issues set to all of the failed test case titles', () => {

                });
            });
            describe('and the test-result.json file contains three failed test cases. Two pertaining to admin users and one pertaining to editor users', () => {
                it('should call createNewIssue with accessGroups set to ["admin", "edeitor"] and issues set to all of the failed test case titles', () => {

                });
            });
        });
    });
    describe('and the test command returns a code of 0', () => {
        describe('and there is a an active issue', () => {
            it('should resolve the active issue', () => {

            });
        });
        describe('and there is not an active issue', () => {
            it('should resolve without performing any writes to the database', () => {

            });
        });
    });
});
