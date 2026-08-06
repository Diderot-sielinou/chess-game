import { WebSocketGateway, ConnectedSocket, OnGatewayConnection } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway()
export class GameGateway implements OnGatewayConnection {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) {
      console.log('Token manquant, déconnexion...');
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify(token as string);
      // Stocke l’ID utilisateur pour toutes les actions
      client.data.userId = payload.sub;
      console.log(`Client connecté avec userId: ${client.data.userId}`);
    } catch (err) {
      console.log('Token invalide, déconnexion...', err);
      client.disconnect(true);
    }
  }
}
