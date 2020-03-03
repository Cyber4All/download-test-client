/**
 * @swagger
 * components:
 *  schemas:
 *      OutageReport:
 *          type: Object
 *          required:
 *              - name
 *              - accessGroups
 *              - issues
 *              - discovered
 *          properties:
 *              name:
 *                  type: string
 *                  description: The type of failing test
 *              accessGroups:
 *                  type: array
 *                  description: String array of affected access groups
 *              issues:
 *                  type: array
 *                  description: String array of failing tests
 *              discovered:
 *                  type: object
 *                  description: Date object of when discovered
 *              links:
 *                  type: array
 *                  description: The string array of failing URLs
 *              resolved:
 *                  type: object
 *                  description: Date object of when resolved
 *          example:
 *              name: downloads
 *              accessGroups: []
 *              issues: []
 *              discovered: 2019-10-01T21:32:27.759+00:00
 */
export interface OutageReport {
    name: string;
    accessGroups: string[];
    issues: string[];
    discovered: Date;
    links?: string[];
    resolved?: Date;
}

/**
 * @swagger
 * components:
 *  schemas:
 *      OutageReportUpdates:
 *          type: Object
 *          properties:
 *              accessGroups:
 *                  type: array
 *                  description: String array of affected access groups
 *              issues:
 *                  type: array
 *                  description: String array of failing tests
 *              links:
 *                  type: array
 *                  description: The string array of failing URLs
 *              resolved:
 *                  type: object
 *                  description: Date object of when resolved
 *          example:
 *              accessGroups: []
 *              issues: []
 *              links: []
 *              resolved: 2019-10-01T21:32:27.759+00:00
 */
export interface OutageReportUpdates {
    accessGroups?: string[];
    issues?: string[];
    links?: string[];
    resolved?: Date;
}
