import { choseCard } from '../domain/behaviors';

export const makeChoseCard = ({ turnRepository }) => async ({ playerId, turnId, cardId }) => {
  const turnState = await turnRepository.getTurnById(turnId);
  const result = choseCard(turnState, { playerId, cardId });
  if (!result.error) {
    await turnRepository.saveTurn(turnId, result.events);
  }
  return result;
};
