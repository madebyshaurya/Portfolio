import type * as Party from "partykit/server";

interface CursorState {
  x: number;
  y: number;
  country: string;
  lastActive: number;
}

export default class CursorServer implements Party.Server {
  options: Party.ServerOptions = { hibernate: true };

  constructor(public party: Party.Party) {}

  getConnectionCount() {
    let count = 0;
    for (const _ of this.party.getConnections()) {
      count++;
    }
    return count;
  }

  broadcastPresenceCount(exclude?: string[]) {
    const count = this.getConnectionCount();
    const countries: Record<string, { code: string; name: string; count: number }> = {};
    for (const conn of this.party.getConnections<CursorState>()) {
      const state = conn.state;
      if (state?.country) {
        if (!countries[state.country]) {
          countries[state.country] = { code: state.country, name: state.country, count: 0 };
        }
        countries[state.country].count++;
      }
    }
    this.party.broadcast(
      JSON.stringify({
        type: "presence",
        count,
        countries: Object.values(countries).sort((a, b) => b.count - a.count),
      }),
      exclude
    );
  }

  onConnect(connection: Party.Connection<CursorState>, ctx: Party.ConnectionContext) {
    const country = (ctx.request.cf?.country as string) || "XX";

    connection.setState({ x: -1, y: -1, country, lastActive: Date.now() });

    // Send current cursors to the new connection
    const cursors: Record<string, CursorState> = {};
    for (const conn of this.party.getConnections<CursorState>()) {
      if (conn.id !== connection.id && conn.state && conn.state.x >= 0) {
        cursors[conn.id] = conn.state;
      }
    }

    connection.send(
      JSON.stringify({
        type: "sync",
        cursors,
        count: this.getConnectionCount(),
      })
    );

    // Notify others someone joined
    this.party.broadcast(
      JSON.stringify({
        type: "join",
        id: connection.id,
        country,
      }),
      [connection.id]
    );

    this.broadcastPresenceCount();
  }

  onMessage(message: string, sender: Party.Connection<CursorState>) {
    const data = JSON.parse(message);

    if (data.type === "cursor") {
      const currentState = sender.state ?? { country: "XX", lastActive: Date.now(), x: -1, y: -1 };
      sender.setState({
        ...currentState,
        x: data.x,
        y: data.y,
        lastActive: Date.now(),
      });

      this.party.broadcast(
        JSON.stringify({
          type: "cursor",
          id: sender.id,
          x: data.x,
          y: data.y,
          country: currentState.country,
        }),
        [sender.id]
      );
    }
  }

  onClose(connection: Party.Connection<CursorState>) {
    this.party.broadcast(
      JSON.stringify({
        type: "leave",
        id: connection.id,
      })
    );
    this.broadcastPresenceCount();
  }

  onError(connection: Party.Connection<CursorState>) {
    this.party.broadcast(
      JSON.stringify({
        type: "leave",
        id: connection.id,
      })
    );
    this.broadcastPresenceCount();
  }
}
