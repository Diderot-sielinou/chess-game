/* eslint-disable no-unused-vars */
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AiService } from '../ai/ai.service';
import { GameService } from '../game/game.service';
import { UseGuards, HttpException } from '@nestjs/common';
// import { WsAuthGuard } from '../auth/guards/ws-auth.guard';
import { OnEvent } from '@nestjs/event-emitter';
import { MatchmakingService } from '../matchmaking/matchmaking.service';
import { JwtService } from '@nestjs/jwt';
import { MyLoggerService } from '../my-logger/my-logger.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Spécifier explicitement les transports pour éviter le "socket hang up"
  transports: ['websocket', 'polling'],
})
// @UseGuards(WsAuthGuard) // ✅
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly gamesService: GameService,
    private readonly aiService: AiService,
    private readonly matchmakingService: MatchmakingService,
    private readonly jwtService: JwtService,
    private readonly logger: MyLoggerService,
  ) {}

  // ✅ Quand un joueur se connecte
  // ✅ Validation JWT directement dans handleConnection
  async handleConnection(@ConnectedSocket() client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) {
      this.logger.log('Token manquant, déconnexion...');
      client.disconnect(true);
      return;
    }

    try {
      const payload: any = this.jwtService.verify(token as string);
      client.data.userId = payload.sub;
      client.data.username = payload.name;
      this.logger.log(`Client connecté: ${client.id}, userId: ${client.data.userId}`);

      // Room privée par utilisateur
      await client.join(String(client.data.userId));
      this.logger.log(`Client rejoint room privée: ${client.data.userId}`);
    } catch (err) {
      this.logger.error('Token invalide, déconnexion...');
      client.disconnect(true);
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}, userId: ${client.data.userId}`);
    const rooms = Array.from(client.rooms).filter((r) => r !== client.id);
    rooms.forEach((gameId) => {
      this.server.to(gameId).emit('playerDisconnected', {
        userId: client.data.userId,
        message: 'A player has disconnected.',
      });
    });
  }

  @OnEvent('game.playerResigned')
  handlePlayerResigned(payload: { gameId: string; winnerId: string; playerId: string }) {
    const opponentId = payload.playerId === payload.winnerId ? null : payload.playerId;

    if (opponentId) {
      this.server.to(opponentId.toString()).emit('playerResigned', {
        message: `Your opponent has resigned the game.`,
        winner: payload.winnerId,
        gameId: payload.gameId,
      });
    }
  }

  @OnEvent('game.nextTurn')
  handleNextTurn(payload: { gameId: string; nextPlayerId: string; lastMove: any; game: any }) {
    this.logger.log(`ecouter de l'evenement de playmove generer gameId: ${payload.gameId} game :
      ${JSON.stringify(payload.game)}  `);

    if (payload.nextPlayerId === 'AI') {
      this.logger.log(`C'est au tour de l'IA, pas besoin d'envoyer yourTurn`);
      return;
    }

    this.server.to(payload.nextPlayerId.toString()).emit('yourTurn', {
      gameId: payload.gameId,
      lastMove: payload.lastMove,
      game: payload.game,
      message: "It's your turn!",
    });
  }

  @OnEvent('game.aiPlayed')
  handleAiPlayed(payload: { gameId: string; lastMove: any; game: any }) {
    this.logger.log(`IA a joué dans game ${payload.gameId} -> ${JSON.stringify(payload.lastMove)}`);

    // Diffuser le coup joué par l'IA à tous les joueurs de la partie
    this.server.to(payload.gameId.toString()).emit('aiMovePlayed', {
      gameId: payload.gameId,
      lastMove: payload.lastMove,
      game: payload.game,
    });
  }

  @SubscribeMessage('joinGame')
  async handleJoinGame(@MessageBody() body: { gameId: string }, @ConnectedSocket() client: Socket) {
    try {
      this.logger.log('user joinGame', body.gameId);
      await client.join(body.gameId);
      client.emit('joined', {
        message: `You have joined the game as ${client.data.userId}.`,
      });
    } catch (error) {
      console.error('Error joining game:', error);
      client.emit('error', { message: 'An error occurred while joining the game.' });
    }
  }

  @SubscribeMessage('makeMove')
  async handleMove(
    @MessageBody()
    body: { gameId: string; move: string; to: string; promotion?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const moveResult = await this.gamesService.playMove(
        body.gameId,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        client.data.userId, // ✅ récupéré depuis le guard
        body.move,
        body.promotion,
      );

      this.server.to(body.gameId).emit('movePlayed', moveResult);

      const game = await this.gamesService.getGame(body.gameId);
      if (game.status !== 'active') {
        const result = game.status;
        this.server.to(body.gameId).emit('gameOver', {
          game,
          gameId: body.gameId,
          result: result,
          winner: game.winner,
          statsUpdated: true,
        });
      }
    } catch (error) {
      if (error instanceof HttpException) {
        client.emit('error', { status: error.getStatus(), message: error.getResponse() });
      } else {
        console.error('An unexpected error occurred during move:', error);
        client.emit('error', { message: 'An unexpected error occurred.' });
      }
    }
  }

  @SubscribeMessage('getSuggestion')
  async handleGetSuggestion(
    @MessageBody() body: { gameId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const game = await this.gamesService.getGame(body.gameId);
      if (!game) {
        client.emit('error', { message: 'Game not found.' });
        return;
      }
      this.logger.log(`demande de suggestion au backend ${JSON.stringify(game)}`);

      const isWhitePlayer = String(game.whitePlayer) === client.data.userId;
      const isBlackPlayer = String(game.blackPlayer) === client.data.userId;

      if (!isWhitePlayer && !isBlackPlayer) {
        client.emit('error', { message: 'You are not part of this game.' });
        return;
      }

      const suggestionDto = {
        gameId: body.gameId,
        playerId: client.data.userId, // ✅ vient du guard
        suggestionsCount: 3,
      };

      const suggestions = await this.aiService.suggestMoves(suggestionDto);
      this.logger.log(`reponse du backend de suggestion ${JSON.stringify(suggestions)}`);

      client.emit('suggestionReceived', { suggestions });
    } catch (error) {
      console.error('Error when requesting suggestion:', error);
      client.emit('error', {
        message: 'An error occurred when requesting suggestion.',
      });
    }
  }

  @SubscribeMessage('joinQueue')
  async handleJoinQueue(client: Socket, payload: { timeControl: string }) {
    const game = await this.matchmakingService.enqueue(client.id, payload.timeControl);
    if (game) {
      this.server.to(String(game.whitePlayer)).emit('matchFound', game);
      this.server.to(String(game.blackPlayer)).emit('matchFound', game);
    } else {
      this.server
        .to(String(client.data.userId))
        .emit('Waiting', { message: 'Waiting for another player...' });
    }
  }

  @SubscribeMessage('createVsAI')
  async handleCreateVsAI(client: Socket, payload: { timeControl: string }) {
    this.logger.log(`partir contre l'ia creer par socket`);
    const game = await this.gamesService.createGame({
      whitePlayer: client.data.userId,
      blackPlayer: 'AI',
      timeControl: payload.timeControl,
    });
    this.logger.log(`partir contre l'ia creer par socket ${JSON.stringify(game)}`);

    // client.join(game._id.toString());
    client.emit('aiGameCreated', game);
  }

  @SubscribeMessage('resign')
  async handleResign(@MessageBody() body: { gameId: string }, @ConnectedSocket() client: Socket) {
    try {
      const result = await this.gamesService.resign(body.gameId, client.data.userId as string);
      this.logger.log(`player ${client.data.userId} resign parti `);
    } catch (error) {
      console.error('Error resigning game:', error);
      client.emit('error', { message: 'An error occurred while resigning the game.' });
    }
  }
}
