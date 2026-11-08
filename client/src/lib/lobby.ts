import { TankiAPI } from "./api";

export class Lobby {

    private list = document.querySelector<HTMLUListElement>("#games-list");
    private statusElement = document.querySelector<HTMLParagraphElement>("#games-status");
    private messageElement = document.querySelector<HTMLParagraphElement>("#lobby-message");
    private selectedElement = document.querySelector<HTMLParagraphElement>("#selected-game");
    private newButton = document.querySelector<HTMLButtonElement>("#new-game");
    private clearButton = document.querySelector<HTMLButtonElement>("#clear-games");
    private lastList = "";
    private refreshing = false;
    private refreshQueued = false;
    private mutating = false;
    private revision = 0;
    private lastSelection: string | null | undefined;

    constructor(
        private api: TankiAPI,
        private onSelect: (id: string | null) => void,
    ) {}

    private updateSelection(reconnect = false) {
        const match = /^\/game\/([^/]+)\/?$/.exec(window.location.pathname);
        let id: string | null = null;

        try {
            if (match?.[1]) {
                id = decodeURIComponent(match[1]);
            }
        } catch {}

        if (this.selectedElement) {
            this.selectedElement.textContent = id ? `Game ${id}` : "No game selected";
        }

        if (reconnect || id !== this.lastSelection) {
            this.lastSelection = id;
            this.onSelect(id);
        }

        const links = this.list?.querySelectorAll<HTMLAnchorElement>("a");

        if (!links || links.length === 0) {
            return;
        }

        for (const link of links) {
            if (link.dataset["gameId"] === id) {
                link.setAttribute("aria-current", "page");
                continue;
            }

            link.removeAttribute("aria-current");
        }
    }

    private renderGames(ids: string[]) {
        const signature = JSON.stringify(ids);

        if (signature !== this.lastList && this.list) {
            this.lastList = signature;
            this.list.replaceChildren(...ids.map((id) => {
                const item = document.createElement("li");
                const link = document.createElement("a");

                // TODO: HTTP ENDPOINT
                link.href = `/game/${encodeURIComponent(id)}`;
                link.textContent = id;
                link.dataset["gameId"] = id;
                item.append(link);
                return item;
            }));
            this.updateSelection();
        }

        const text = ids.length ? `${ids.length} ${ids.length === 1 ? "game" : "games"} available` : "No active games";

        if (this.statusElement && this.statusElement.textContent !== text) {
            this.statusElement.textContent = text;
        }
    }

    private async refreshGames() {
        if (this.mutating) {
            return;
        }

        if (this.refreshing) {
            this.refreshQueued = true;
            return;
        }

        this.refreshing = true;
        const requestRevision = this.revision;

        try {
            const ids = await this.api.getGames();

            if (requestRevision === this.revision) {
                this.renderGames(ids);
            }
        } catch (error: unknown) {
            if (requestRevision === this.revision && this.statusElement) {
                this.statusElement.textContent = "Unable to refresh games. Retrying…";
                console.error("Failed to refresh games:", error);
            }
        } finally {
            this.refreshing = false;

            if (this.refreshQueued) {
                this.refreshQueued = false;
                void this.refreshGames();
            }
        }
    }

    private async runAction(action: "new" | "clear") {
        if (this.mutating) {
            return;
        }

        this.mutating = true;
        this.revision++;

        if (!this.newButton || !this.clearButton || !this.messageElement) {
            this.mutating = false;
            return;
        }

        this.newButton.disabled = this.clearButton.disabled = true;
        this.messageElement.dataset["error"] = "false";
        this.messageElement.textContent = action === "new" ? "Creating game…" : "Clearing games…";

        try {
            if (action === "new") {
                const id = await this.api.newGame();

                this.messageElement.textContent = `Created game ${id}.`;
                window.history.pushState(null, "", `/game/${encodeURIComponent(id)}`);
                this.updateSelection(true);
            } else {
                await this.api.clearGames();
                this.renderGames([]);
                this.messageElement.textContent = "Games cleared.";
                window.history.pushState(null, "", "/");
                this.updateSelection(true);
            }
        } catch (error: unknown) {
            this.messageElement.dataset["error"] = "true";
            this.messageElement.textContent = action === "new" ? "Unable to create game. Please try again." : "Unable to clear games. Please try again.";
            console.error("Lobby action failed:", error);
        } finally {
            this.mutating = false;
            this.newButton.disabled = this.clearButton.disabled = false;
            void this.refreshGames();
        }
    }

    private handleGameClick(event: MouseEvent) {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        const target = event.target;

        if (!(target instanceof Element)) {
            return;
        }

        const link = target.closest<HTMLAnchorElement>("a[data-game-id]");

        if (!link) {
            return;
        }

        event.preventDefault();

        if (window.location.pathname !== link.pathname) {
            window.history.pushState(null, "", link.pathname);
        }

        this.updateSelection(true);
    }

    public initializePage() {
        if (!this.newButton || !this.clearButton || !this.list) {
            return;
        }

        this.newButton.addEventListener("click", () => void this.runAction("new"));
        this.clearButton.addEventListener("click", () => void this.runAction("clear"));
        this.list.addEventListener("click", (event) => this.handleGameClick(event));

        window.addEventListener("popstate", () => this.updateSelection());
        this.updateSelection();
        void this.refreshGames();
        window.setInterval(() => void this.refreshGames(), 1000);
    }
}
