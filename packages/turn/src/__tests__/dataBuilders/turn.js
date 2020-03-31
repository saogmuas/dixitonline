import faker from 'faker';
import { events } from '../../domain/events';
import { turnReducer } from '../../domain/reducers';
import { buildTestPlayer } from './player';

export const buildTestTurn = () => {
  let defaultPlayers = [buildTestPlayer().build(), buildTestPlayer().build(), buildTestPlayer().build()];
  let id = faker.random.uuid();
  let history = [];

  const getStoryteller = () => defaultPlayers[0];

  return {
    withId(idOverride = id) {
      id = idOverride;
      return this;
    },
    withPlayers(players = defaultPlayers) {
      defaultPlayers = players;
      return this;
    },
    inPlayersCardChoicePhase() {
      history.push(
        events.clueDefined({
          text: faker.lorem.sentence(),
          cardId: getStoryteller().hand[0].id,
        })
      );
      const self = this;
      return {
        ...self,
        withPlayerThatHavePlayed(player = defaultPlayers[1]) {
          history.push(events.playerCardChosen({ playerId: player.id, cardId: player.hand[0].id }));
          return this;
        },
      };
    },
    inPlayersVotingPhase() {
      this.inPlayersCardChoicePhase();
      const playersCardChosenEvents = defaultPlayers
        .filter(player => player.id !== getStoryteller().id)
        .map(player => events.playerCardChosen({ playerId: player.id, cardId: player.hand[0].id }));
      history = history.concat(playersCardChosenEvents);
      const self = this;
      return {
        ...self,
        withPlayerThatHavePlayed({ playerId, voteOnCardOwnedByPlayerId }) {
          history.push(
            events.playerVoted({
              playerId,
              cardId: defaultPlayers.filter(p => p.id === voteOnCardOwnedByPlayerId)[0].hand[0].id,
            })
          );
          return this;
        },
      };
    },
    inScoringPhase() {
      return this.inPlayersVotingPhase()
        .withPlayerThatHavePlayed({
          playerId: defaultPlayers[1].id,
          voteOnCardOwnedByPlayerId: defaultPlayers[2].id,
        })
        .withPlayerThatHavePlayed({
          playerId: defaultPlayers[2].id,
          voteOnCardOwnedByPlayerId: defaultPlayers[0].id,
        });
    },
    withHistory(historyOverrides = []) {
      history = history.concat(historyOverrides);
      return this;
    },
    build() {
      const turnStarted = events.turnStarted({ id, storytellerId: getStoryteller().id, players: defaultPlayers });
      return [turnStarted, ...history].reduce(turnReducer, {});
    },
  };
};
