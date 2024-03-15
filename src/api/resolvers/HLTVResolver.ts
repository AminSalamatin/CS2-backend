import HLTV, {
  FullStream,
  TeamRanking,
  PlayerRanking,
  EventPreview,
  FullPlayer,
  FullEvent,
  NewsPreview,
  FullTeam,
  RankingFilter,
} from 'hltv';

export default {
  Query: {
    getStreams: async (): Promise<FullStream[]> => {
      const streams = await HLTV.getStreams();
      return streams;
    },
    getTeamRanking: async (): Promise<TeamRanking[]> => {
      const ranking = await HLTV.getTeamRanking();
      return ranking;
    },
    getTeam: async (_parent: {}, args: {id: number}): Promise<FullTeam> => {
      const team = await HLTV.getTeam(args);
      return team;
    },
    getPlayerRanking: async (): Promise<PlayerRanking[]> => {
      const ranking = await HLTV.getPlayerRanking({
        rankingFilter: RankingFilter.Top50,
      });
      return ranking;
    },
    getPlayer: async (_parent: {}, args: {id: number}): Promise<FullPlayer> => {
      const player = await HLTV.getPlayer(args);
      return player;
    },
    getEvents: async (): Promise<EventPreview[]> => {
      const events = await HLTV.getEvents();
      console.log(events);
      return events;
    },
    getEvent: async (_parent: {}, args: {id: number}): Promise<FullEvent> => {
      const event = await HLTV.getEvent(args);
      console.log(event);
      return event;
    },
    getNews: async (): Promise<NewsPreview[]> => {
      const news = await HLTV.getNews({
        year: 2022,
      });
      news.map((oneNews) => {
        oneNews.link = 'https://www.hltv.org/' + oneNews.link;
        return oneNews;
      });
      console.log(news);
      return news;
    },
    getEventByName: async (
      _parent: {},
      args: {name: string},
    ): Promise<FullEvent> => {
      const event = await HLTV.getEventByName(args);
      return event;
    },
    getTeamByName: async (
      _parent: {},
      args: {name: string},
    ): Promise<FullTeam> => {
      const team = await HLTV.getTeamByName(args);
      return team;
    },
    getPlayerByName: async (
      _parent: {},
      args: {name: string},
    ): Promise<FullPlayer> => {
      const player = await HLTV.getPlayerByName(args);
      return player;
    },
  },
};
