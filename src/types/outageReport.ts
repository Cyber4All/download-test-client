export interface OutageReport {
    name: string;
    accessGroups: string[];
    issues: string[];
    discovered: string;
    links?: string[];
    resolved?: boolean;
}

export interface OutageReportUpdates {
    accessGroups?: string[];
    issues?: string[];
    links?: string[];
    resolved?: boolean;
}
