// import { io } from 'socket.io-client';

// // ⚠️ Remplace par tes tokens valides
const TOKEN_1 =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGE2NjcxMTMxNTAwODA0ZDZkZmY3NzciLCJuYW1lIjoiVXNlcl9mYmJiZGMiLCJpYXQiOjE3NTU3MzU4MjUsImV4cCI6MTc1NjM0MDYyNX0.Hc8xsOYRWWXOgEN5mjGa_cw7WTj_NEmzxqfhheUsa6Q';
const TOKEN_2 =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGE1YTBmM2ViMGVmYzE0OWIwMmI4MGUiLCJuYW1lIjoiVXNlcl84M2E2NDAiLCJpYXQiOjE3NTU2ODUxMDcsImV4cCI6MTc1NjI4OTkwN30.88dLqdUteI3DEgvpYf8_oeTfE881V8KGIVLrevmFTOI';

// const movesPlayer1 = ['e2e4', 'd2d4', 'g1f3', 'f1c4'];
// const movesPlayer2 = ['e7e5', 'd7d5', 'b8c6', 'f8c5'];

// function createPlayer(token: string, moves: string[]) {
//   let moveIndex = 0;
//   let gameId: string | null = null;

//   const socket = io('http://localhost:3000', {
//     auth: { token },
//   });

//   socket.on('connect', () => {
//     console.log(`${token.slice(0, 6)} connected with id ${socket.id}`);
//     // Rejoindre la queue du matchmaking
//     socket.emit('joinMatchmaking', { timeControl: '5+0' });
//   });

//   socket.on('gameFound', (data) => {
//     console.log(`${token.slice(0, 6)} game found!`, data);
//     gameId = data.gameId;

//     // Rejoindre la partie
//     socket.emit('joinGame', { gameId });

//     // Demander une suggestion au début
//     socket.emit('getSuggestion', { gameId });
//   });

//   socket.on('joined', (data) => console.log(`${token.slice(0, 6)} joined:`, data));

//   socket.on('movePlayed', (data) => {
//     console.log(`${token.slice(0, 6)} movePlayed:`, data);

//     // Demande une suggestion à chaque tour
//     socket.emit('getSuggestion', { gameId: data.gameId });

//     // Jouer le prochain coup si c'est son tour
//     if (moveIndex < moves.length && data.nextTurnToken === token) {
//       const nextMove = moves[moveIndex++];
//       console.log(`${token.slice(0, 6)} playing move: ${nextMove}`);
//       socket.emit('makeMove', { gameId: data.gameId, move: nextMove });
//     }
//   });

//   socket.on('suggestionReceived', (data) => console.log(`${token.slice(0, 6)} suggestion:`, data));

//   socket.on('invalidMove', (data) => console.log(`${token.slice(0, 6)} invalidMove:`, data));
//   socket.on('invalidTurn', (data) => console.log(`${token.slice(0, 6)} invalidTurn:`, data));
//   socket.on('playerDisconnected', (data) =>
//     console.log(`${token.slice(0, 6)} disconnected:`, data),
//   );
//   socket.on('playerResigned', (data) => console.log(`${token.slice(0, 6)} resigned:`, data));
//   socket.on('gameEnded', (data) => {
//     console.log(`${token.slice(0, 6)} game ended:`, data);

//     // Déconnecter automatiquement après la fin de la partie
//     socket.disconnect();
//   });

//   socket.on('error', (data) => console.log(`${token.slice(0, 6)} error:`, data));

//   return socket;
// }

// // Lancer les deux joueurs
// const player1 = createPlayer(TOKEN_1, movesPlayer1);
// // eslint-disable-next-line no-unused-vars
// const player2 = createPlayer(TOKEN_2, movesPlayer2);

// // Exemple optionnel : faire abandonner un joueur après 10 secondes
// setTimeout(() => {
//   console.log('Player 1 resigning...');
//   player1.emit('resign', { gameId: 'auto' }); // si gameId est connu, remplacer 'auto'
// }, 10000);

// test-matchmaking.js
// const io = require('socket.io-client');
// const axios = require('axios');

// // ⚠️ Remplace par l'URL de ton backend
// const BASE_URL = 'http://localhost:3000/api';
// const SOCKET_URL = 'http://localhost:3000';

// // ⚠️ Tokens JWT pour chaque joueur (doivent être valides)
// const PLAYER1_TOKEN = `Bearer ${TOKEN_1}`;
// const PLAYER2_TOKEN = `Bearer ${TOKEN_2}`;

// async function joinQueue(playerToken, playerName) {
//   const socket = io(SOCKET_URL, {
//     auth: {
//       token: playerToken.replace('Bearer ', ''),
//     },
//   });

//   // Écoute l'événement matchFound
//   socket.on('matchFound', (game) => {
//     console.log(`[${playerName}] Reçu via socket:`, game);
//   });

//   // Requête HTTP pour rejoindre la file
//   const response = await axios.post(
//     `${BASE_URL}/matchmaking/join`,
//     { timeControl: '300+0' },
//     { headers: { Authorization: playerToken } },
//   );

//   console.log(`[${playerName}] Reçu via HTTP:`, response.data);
// }

// async function testWorkflow() {
//   console.log('--- Test Workflow ---');

//   // Player1 rejoint la file
//   void joinQueue(PLAYER1_TOKEN, 'Player1');

//   // Pause pour simuler attente
//   await new Promise((r) => setTimeout(r, 1000));

//   // Player2 rejoint la file
//   void joinQueue(PLAYER2_TOKEN, 'Player2');

//   // Pour test fallback IA, tu peux commenter Player2 et attendre > AI_FALLBACK_AFTER_MS
// }

// testWorkflow().catch(console.error);
import { io } from 'socket.io-client';
import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

// ⚠️ Remplace par tes tokens JWT valides
const PLAYER1_TOKEN = TOKEN_1;
const PLAYER2_TOKEN = TOKEN_2;

// Helper pour créer un client Axios avec JWT
const createApi = (token) =>
  axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

// Fonction pour connecter un joueur à Socket.io et écouter tous les événements
function connectSocket(token, playerName) {
  const socket = io(SOCKET_URL, { auth: { token } });

  socket.on('connect', () => console.log(`[${playerName}] Socket connected`));
  socket.onAny((event, data) =>
    console.log(`[${playerName}] Event: ${event}`, JSON.stringify(data, null, 2)),
  );

  return socket;
}

// Fonction pour rejoindre la file de matchmaking
async function joinQueue(token, playerName) {
  const socket = connectSocket(token, playerName);

  socket.on('matchFound', (game) => {
    console.log(`[${playerName}] Match trouvé via socket:`, game);
  });

  // Écouter les events du serveur
  socket.on('joined', (data) => console.log('Joined:', data));
  socket.on('movePlayed', (data) => console.log('Move played:', data));
  socket.on('suggestionReceived', (data) => console.log('Suggestion:', data));
  socket.on('invalidMove', (data) => console.log('Invalid move:', data));
  socket.on('invalidTurn', (data) => console.log('Invalid turn:', data));
  socket.on('playerDisconnected', (data) => console.log('Player disconnected:', data));
  socket.on('error', (data) => console.log('Error:', data));

  const response = await axios.post(
    `${BASE_URL}/matchmaking/join`,
    { timeControl: '300+0' },
    { headers: { Authorization: `Bearer ${token}` } },
  );

  console.log(`[${playerName}] Reçu via HTTP:`, response.data);

  return { socket, game: response.data };
}

async function main() {
  console.log('--- Test Workflow Complet ---');

  const api1 = createApi(PLAYER1_TOKEN);
  const api2 = createApi(PLAYER2_TOKEN);

  // --- Phase 1 : Matchmaking ---
  const { socket: socket1 } = await joinQueue(PLAYER1_TOKEN, 'Player1');

  // Pause pour simuler délai d’attente
  await new Promise((r) => setTimeout(r, 1000));

  const { socket: socket2 } = await joinQueue(PLAYER2_TOKEN, 'Player2');

  // --- Phase 2 : Création de la partie (si on bypass matchmaker pour test direct) ---
  const { data: game } = await api1.post('/games/create-vs-ai', { timeControl: '300+0' });
  const gameId = game._id;
  console.log(`Game créé: ${gameId}`);

  // --- Phase 3 : Jouer quelques coups ---
  const moves = ['e2e4', 'e7e5', 'g1f3', 'b8c6'];
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const playerApi = i % 2 === 0 ? api1 : api2;
    const playerName = i % 2 === 0 ? 'Player1' : 'Player2';
    console.log(`➡️ ${playerName} joue ${move}`);

    const res = await playerApi.post('/games/move', { gameId, move });
    console.log(`[${playerName}] Move result:`, res.data.move?.san || res.data);
  }

  // --- Phase 4 : Abandon ---
  console.log('⏳ Attente 3 secondes avant abandon de Player2...');
  await new Promise((r) => setTimeout(r, 3000));

  console.log('➡️ Player2 abandonne la partie');
  const resignRes = await api2.post(`/games/${gameId}/resign`);
  console.log('[Player2] Abandon result:', resignRes.data);

  // --- Phase 5 : Cleanup ---
  await new Promise((r) => setTimeout(r, 2000));
  socket1.disconnect();
  socket2.disconnect();
  console.log('✅ Test workflow complet terminé');
}

main().catch(console.error);
