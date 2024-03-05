import {GraphQLError} from 'graphql';
import HLTV from 'hltv';

const HLTVInstance: HLTV = HLTV.createInstance({
  loadPage: (url: string): Promise<string> => {
    return fetch(url).then((response) => response.text());
  },
});
/*
export default {
    Query: {
      
    },
    Mutation: {
      
    },
};
*/