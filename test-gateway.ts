import { io } from 'socket.io-client';

// ⚠️ Mets ici l'URL de ton backend
const socket = io('http://localhost:3000', {
  auth: {
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGE1YTBmM2ViMGVmYzE0OWIwMmI4MGUiLCJuYW1lIjoiVXNlcl84M2E2NDAiLCJpYXQiOjE3NTU2ODUxMDcsImV4cCI6MTc1NjI4OTkwN30.88dLqdUteI3DEgvpYf8_oeTfE881V8KGIVLrevmFTOI', // nécessaire pour ton WsAuthGuard
  },
});

socket.on('connect', () => {
  console.log('Connected with id:', socket.id);

  // Exemple : rejoindre une partie
  socket.emit('joinGame', { gameId: '68a6645a50bd3d0d9dddd9ee' });

  // Exemple : faire un move
  socket.emit('makeMove', { gameId: '68a6645a50bd3d0d9dddd9ee', move: 'e2e4' });

  // Exemple : demander une suggestion
  socket.emit('getSuggestion', { gameId: '68a6645a50bd3d0d9dddd9ee' });
});

// Écouter les events du serveur
socket.on('joined', (data) => console.log('Joined:', data));
socket.on('movePlayed', (data) => console.log('Move played:', data));
socket.on('suggestionReceived', (data) => console.log('Suggestion:', data));
socket.on('invalidMove', (data) => console.log('Invalid move:', data));
socket.on('invalidTurn', (data) => console.log('Invalid turn:', data));
socket.on('playerDisconnected', (data) => console.log('Player disconnected:', data));
socket.on('error', (data) => console.log('Error:', data));
