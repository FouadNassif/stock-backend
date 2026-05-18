import {
  ConnectedSocket,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

import { PortfolioUpdatedPayload } from '../../messaging/types/realtime-event.type';
import { JwtPayload } from '../../auth/types/jwt-payload.type';

type AuthenticatedSocket = Socket & {
  member?: JwtPayload;
};

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class PortfolioGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token = this.extractToken(client);

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      if (payload.type !== 'member') {
        throw new UnauthorizedException('Invalid socket token');
      }

      client.member = payload;
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('portfolio.join')
  handleJoinPortfolioRoom(@ConnectedSocket() client: AuthenticatedSocket): {
    message: string;
  } {
    if (!client.member) {
      throw new UnauthorizedException('Unauthorized socket connection');
    }

    void client.join(this.getMemberRoom(client.member.sub));

    client.emit('portfolio.joined', {
      memberId: client.member.sub,
    });

    return {
      message: 'Joined portfolio room',
    };
  }

  emitPortfolioUpdated(payload: PortfolioUpdatedPayload): void {
    this.server
      .to(this.getMemberRoom(payload.memberId))
      .emit('portfolio.updated', payload);
  }

  private extractToken(client: Socket): string {
    const auth = client.handshake.auth as Record<string, unknown> | undefined;
    const authToken = auth?.token;

    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const header = client.handshake.headers.authorization;

    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.replace('Bearer ', '');
    }

    throw new UnauthorizedException('Missing socket token');
  }

  private getMemberRoom(memberId: string): string {
    return `member:${memberId}:portfolio`;
  }
}
