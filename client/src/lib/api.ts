import { HTTP_ENDPOINT, API_URL } from "./const";

export class TankiAPI {
    private async request(endpoint: string): Promise<Response> {
        const response = await fetch(`${API_URL}/${endpoint}`, {
            cache: "no-store",
            signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) throw new Error(`Request failed (${response.status}).`);
        return response;
    }

    public async newGame(): Promise<string> {
        const id = await this.request(HTTP_ENDPOINT.NEW).then(res => res.text()).then(data => data.trim());
        if (!id) {
            throw new Error("The server returned an empty game ID.");
        }
        return id;
    }

    public async clearGames(): Promise<void> {
        await this.request(HTTP_ENDPOINT.CLEAR);
    }

    public async getGames(): Promise<string[]> {
        const ids = await this.request(HTTP_ENDPOINT.GAMES).then(res => res.json());
        return ids;
    }
}
