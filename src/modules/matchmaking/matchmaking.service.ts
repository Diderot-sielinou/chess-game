/* eslint-disable no-unused-vars */
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import Redis from 'ioredis';
import { GameService } from '../game/game.service';
import { GameGateway } from '../sockets/game.gateway';

const QUEUE_KEY = (tc: string) => `matchmaking:queue:tc:${tc}`;
const DEFAULT_TC = '300+0'; // ♟️ 5+0
const AI_FALLBACK_AFTER_MS = 60_000; // ⏳ 15s d’attente avant IA
const MAX_QUEUE_LENGTH = 1000; // hygiène

type QueuePlayer = {
  userId: string;
  timeControl: string;
  enqueuedAt: number; // epoch ms
};

@Injectable()
export class MatchmakingService {
  constructor(
    @Inject('REDIS') private readonly redis: Redis,
    @Inject(forwardRef(() => GameService))
    private readonly gamesService: GameService,
    // ⚠️ on suppose que GameGateway est exporté depuis son module
    @Inject(forwardRef(() => GameGateway))
    private readonly gateway: GameGateway,
  ) {}

  /** Joindre la file (par cadence), puis tenter un match immédiat ou fallback IA */
  async enqueue(userId: string, timeControl?: string) {
    const tc = timeControl || DEFAULT_TC;
    const player: QueuePlayer = { userId, timeControl: tc, enqueuedAt: Date.now() };
    const key = QUEUE_KEY(tc);

    // 🧹 Anti-doublon : retirer toute occurrence précédente de ce joueur
    await this.removeFromAllQueues(userId);

    // ↕️ Pousser dans la file (limiter la taille)
    await this.redis.lpush(key, JSON.stringify(player));
    await this.redis.ltrim(key, 0, MAX_QUEUE_LENGTH - 1);

    // 🔎 Tenter un match immédiat
    const game = await this.tryMatch(tc);
    if (game) {
      // 📣 Notifier chacun dans sa room privée userId
      this.gateway.server.to(String(game.whitePlayer)).emit('matchFound', game);
      this.gateway.server.to(String(game.blackPlayer)).emit('matchFound', game);
      return game;
    }

    // ⛑️ Fallback IA si attente trop longue (contrôle à l’instant T)
    const fallback = await this.tryAiFallback(player);
    if (fallback) {
      this.gateway.server.to(String(fallback.whitePlayer)).emit('matchFound', fallback);
      return fallback;
    }

    // Sinon on reste en attente
    return null;
  }

  /** Lecture de la file par cadence (debug/admin) */
  async getQueue(tc?: string) {
    if (tc) {
      const list = await this.redis.lrange(QUEUE_KEY(tc), 0, -1);
      return list.map((x) => JSON.parse(x) as QueuePlayer);
    }
    // Toutes les files (optionnel: tu peux stocker la liste des TC autorisées)
    // Ici on retourne seulement la file par défaut
    const list = await this.redis.lrange(QUEUE_KEY(DEFAULT_TC), 0, -1);
    return list.map((x) => JSON.parse(x) as QueuePlayer);
  }

  /** Essaye de faire un match 1v1 (même cadence) */
  private async tryMatch(tc: string) {
    const key = QUEUE_KEY(tc);

    // ⚠️ Section critique : on utilise WATCH pour éviter les races.
    await this.redis.watch(key);
    try {
      const two = await this.redis.lrange(key, 0, 1);
      if (two.length < 2) {
        await this.redis.unwatch();
        return null;
      }

      const p1: QueuePlayer = JSON.parse(two[0]);
      const p2: QueuePlayer = JSON.parse(two[1]);

      // ❌ Même joueur présent 2x (rare, mais on nettoie)
      if (p1.userId === p2.userId) {
        const multi = this.redis.multi();
        // retire toutes occurrences de p1, puis le remet une seule fois
        multi.lrem(key, 0, JSON.stringify(p1));
        multi.lpush(key, JSON.stringify({ ...p1, enqueuedAt: Date.now() }));
        const res = await multi.exec(); // si race: null => relancer
        if (res === null) return this.tryMatch(tc);
        await this.redis.unwatch();
        return null;
      }

      // ✅ On retire les 2 premiers de façon atomique (LTRIM à partir du 2e)
      const tx = this.redis.multi();
      tx.ltrim(key, 2, -1);
      const res = await tx.exec();
      if (res === null) {
        // Un autre worker a modifié la liste : recommence
        return this.tryMatch(tc);
      }

      // 🆕 Créer la partie (choix des couleurs simple: p1=white, p2=black)
      const game = await this.gamesService.createGame({
        whitePlayer: p1.userId,
        blackPlayer: p2.userId,
        timeControl: tc,
      });

      return game;
    } catch (e) {
      await this.redis.unwatch();
      throw e;
    }
  }

  /** Fallback IA si le joueur en tête de file attend trop longtemps */
  private async tryAiFallback(player: QueuePlayer) {
    const waitedMs = Date.now() - player.enqueuedAt;
    if (waitedMs < AI_FALLBACK_AFTER_MS) return null;

    const key = QUEUE_KEY(player.timeControl);

    // ⚠️ Atomiquement : si player est encore en tête, on le retire et on crée IA
    await this.redis.watch(key);
    try {
      const head = await this.redis.lindex(key, 0);
      if (!head) {
        await this.redis.unwatch();
        return null;
      }
      const headObj: QueuePlayer = JSON.parse(head);

      if (headObj.userId !== player.userId) {
        await this.redis.unwatch();
        return null; // il n’est plus en tête, laissons la file matcher normalement
      }

      const tx = this.redis.multi();
      tx.lpop(key); // retire le head
      const res = await tx.exec();
      if (res === null) return null; // race, on abandonne ce tour

      // 🤖 Crée une partie vs IA (joueur = blanc par défaut)
      const game = await this.gamesService.createGame({
        whitePlayer: player.userId,
        blackPlayer: 'AI',
        timeControl: player.timeControl,
      });
      return game;
    } catch (e) {
      await this.redis.unwatch();
      throw e;
    }
  }

  /** Retire un joueur de toutes les files (anti-doublon) */
  private async removeFromAllQueues(userId: string) {
    const tcs = [DEFAULT_TC]; // 👉 si tu as d’autres cadences, liste-les ici
    for (const tc of tcs) {
      const key = QUEUE_KEY(tc);
      // On récupère les éléments et on filtre ceux du userId
      const items = await this.redis.lrange(key, 0, -1);
      if (!items.length) continue;

      const toRemove = items.filter((x) => JSON.parse(x).userId === userId);
      if (!toRemove.length) continue;

      const multi = this.redis.multi();
      for (const v of toRemove) multi.lrem(key, 0, v);
      await multi.exec();
    }
  }
}
