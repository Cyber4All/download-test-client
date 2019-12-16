import { MongoClient, Db } from 'mongodb';
import { OutageReport, OutageReportUpdates } from '../../../types/outageReport';

export class MongoDB {

    private static instance: MongoDB;

    private utilityDb: Db;
    private onionDb: Db;

    private constructor() {}

    /**
     * Gets an instance of the MongoDB connection
     */
    public static async getInstance() {
        if (!this.instance) {
            await this.connect(process.env.CLARK_DB_URI);
        }
        return this.instance;
    }

    /**
     * Connects to the DB given a String URI
     * @param dbURI String, The DB URI to connect to
     */
    private static async connect(dbURI: string) {
        const mongodbClient = await new MongoClient(dbURI, { useNewUrlParser: true }).connect();
        this.instance = new MongoDB();
        this.instance.setDatabase(mongodbClient);
    }

    /**
     * Sets the databases
     * @param mongodbClient The connection client to MongoDB
     */
    private setDatabase(mongodbClient: MongoClient) {
        this.utilityDb = mongodbClient.db('utility');
        this.onionDb = mongodbClient.db('onion');
    }

    async getActiveIssue() {
        return await this.utilityDb.collection('platform-outage-reports').findOne({ name: 'downloads', resolved: null });
    }

    async createNewIssue(outageReport: OutageReport) {
        await this.utilityDb.collection('platform-outage-reports').insertOne(outageReport);
    }

    async updateActiveIssue(updates: OutageReportUpdates) {
        await this.utilityDb.collection('platform-outage-reports').updateOne({ name: 'downloads', resolved: null }, { $set: { updates }});
    }

    private async getAuthorUsername(authorID: string) {
        const user = await this.onionDb.collection('users').findOne({ _id: authorID });
        return user.username;
    }

    /**
     * Creates a filter for object aggregation given the object's status and collection
     * @param status The status of the object
     * @param collection The collection of the object
     */
    private setObjectCollectionFilter(status: string, collection?: string) {
        const filter = {};
        if (collection) {
            filter['$and'] = [{ status }, { collection }];
        } else {
            filter['status'] = status;
        }
        return filter;
    }

    /**
     * Gets a random object given a filter
     * @param filter The aggregation filter object, structured either { status: ... } or as { $and: { status: ..., collection: ... }}
     */
    private async getObject(filter) {
        const objects =  await this.onionDb.collection('objects').aggregate([
            { $match: filter },
            { $sample: { size: 1 }}
        ]).toArray();
        return objects.length == 0 ? undefined : objects[0];
    }

    /**
     * Gets a random learning object and corrosponding author's username given a status and collection
     * @param status The status of the random learning object
     * @param collection The collection of the random learning object
     */
    async getObjectAndAuthUsername(status: string, collection?: string) {
        const filter = this.setObjectCollectionFilter(status, collection);
        const object = await this.getObject(filter);
        let username: string;
        if (object) {
            username = await this.getAuthorUsername(object.authorID);
        }
        return {object, username};
    }
}
