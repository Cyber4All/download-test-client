import { MongoClient, Db } from 'mongodb';
import { OutageReport, OutageReportUpdates } from '../../../types/outageReport';

const UTILITY = 'utility';
const ONION = 'onion';

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
        this.utilityDb = mongodbClient.db(UTILITY);
        this.onionDb = mongodbClient.db(ONION);
    }

    /**
     * Gets the current active issue in the system
     * @param name The type of report ('downloads', 'search', 'uploads')
     */
    async getActiveIssue(name: string): Promise<OutageReport> {
        return await this.utilityDb.collection('platform-outage-reports').findOne({ name, resolved: null });
    }

    /**
     * Creates a new active issue in the system
     * @param outageReport The outage report to create
     */
    async createNewIssue(outageReport: OutageReport) {
        await this.utilityDb.collection('platform-outage-reports').insertOne(outageReport);
    }

    /**
     * Updates an active issue with new information
     * @param updates The updates to the report
     * @param name The type of report ('downloads', 'search', 'uploads')
     */
    async updateActiveIssue(updates: OutageReportUpdates, name: string) {
        await this.utilityDb.collection('platform-outage-reports').updateOne({ name, resolved: null },
            {
                $set: {
                    ...updates
                }
            });
    }

    /**
     * Gets a author's username given the ID of the author
     * @param authorID The ID of the author of a learning object
     */
    private async getAuthorUsername(authorID: string) {
        const user = await this.onionDb.collection('users').findOne({ _id: authorID });
        return user.username;
    }

    /**
     * Creates a filter for object aggregation given the object's status and collection.
     * Collection is optional, in case the object doesn't need to be apart of any
     * particular collection.
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
