import { Requester } from './drivers/jwt/tokenManager';

export const regularUser: Requester = {
    username: 'ccan',
    name: 'clark can',
    email: 'ccan@clark.center',
    organization: 'towson university',
    emailVerified: true,
    accessGroups: []
};

export const reviewerUser: Requester = {
    username: 'cedison',
    name: 'clark edison',
    email: 'cedison@clark.center',
    organization: 'towson university',
    emailVerified: true,
    accessGroups: ['reviewer@nccp']
};

export const curatorUser: Requester = {
    username: 'cgreen',
    name: 'clark green',
    email: 'cgreen@clark.center',
    organization: 'towson university',
    emailVerified: true,
    accessGroups: ['curator@nccp']
};

export const editorUser: Requester = {
    username: 'ckent',
    name: 'clark kent',
    email: 'ckent@clark.center',
    organization: 'towson university',
    emailVerified: true,
    accessGroups: ['editor']
};

export const adminUser: Requester = {
    username: 'cgriswold',
    name: 'clark griswold',
    email: 'cgriswold@clark.center',
    organization: 'towson university',
    emailVerified: true,
    accessGroups: ['admin']
};