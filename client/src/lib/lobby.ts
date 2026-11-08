import { TankiAPI } from "./api";

export function initializeLobby(api: TankiAPI, onSelect: (id: string | null) => void): void {
  const list = document.querySelector<HTMLUListElement>("#games-list");
  const status = document.querySelector<HTMLParagraphElement>("#games-status");
  const message = document.querySelector<HTMLParagraphElement>("#lobby-message");
  const selected = document.querySelector<HTMLParagraphElement>("#selected-game");
  const newButton = document.querySelector<HTMLButtonElement>("#new-game");
  const clearButton = document.querySelector<HTMLButtonElement>("#clear-games");

  let lastList = "";
  let refreshing = false;
  let refreshQueued = false;
  let mutating = false;
  let revision = 0;
  let lastSelection: string | null | undefined;

  function updateSelection(reconnect = false): void {
    const match = /^\/game\/([^/]+)\/?$/.exec(window.location.pathname);
    let id: string | null = null;
    
    try {
      if (match?.[1]) id = decodeURIComponent(match[1]);
    } catch {}
    
    if (selected) {
      selected.textContent = id ? `Game ${id}` : "No game selected";
    }

    if (reconnect || id !== lastSelection) {
      lastSelection = id;
      onSelect(id);
    }

    const links = list?.querySelectorAll<HTMLAnchorElement>("a");

    if (!links || links?.length === 0) {
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

  function renderGames(ids: string[]): void {
    const signature = JSON.stringify(ids);
    
    if (signature !== lastList && list) {
      lastList = signature;
      list.replaceChildren(...ids.map((id) => {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.href = `/game/${encodeURIComponent(id)}`;
        link.textContent = id;
        link.dataset["gameId"] = id;
        item.append(link);
        return item;
      }));
      updateSelection();
    }
    
    const text = ids.length ? `${ids.length} ${ids.length === 1 ? "game" : "games"} available` : "No active games";
    
    if (status && status.textContent !== text) {
      status.textContent = text;
    }
  }

  async function refreshGames(): Promise<void> {
    if (mutating) {
      return;
    };
    
    if (refreshing) {
      refreshQueued = true;
      return;
    }
    
    refreshing = true;
    const requestRevision = revision;
    
    try {
      const ids = await api.getGames();
      
      if (requestRevision === revision) {
        renderGames(ids);
      }
    } catch (error: unknown) {
      if (requestRevision === revision && status) {
        status.textContent = "Unable to refresh games. Retrying…";
        console.error("Failed to refresh games:", error);
      }
    } finally {
      refreshing = false;
      
      if (refreshQueued) {
        refreshQueued = false;
        void refreshGames();
      }
    }
  }

  async function runAction(action: "new" | "clear"): Promise<void> {
    if (mutating) {
      return;
    }
    
    mutating = true;
    revision++;
    
    if (!newButton || !clearButton || !message) {
      return;
    }

    newButton.disabled = clearButton.disabled = true;
    message.dataset["error"] = "false";
    message.textContent = action === "new" ? "Creating game…" : "Clearing games…";

    try {
      if (action === "new") {
        const id = await api.newGame();
        message.textContent = `Created game ${id}.`;
        window.history.pushState(null, "", `/game/${encodeURIComponent(id)}`);
        updateSelection(true);
      } else {
        await api.clearGames();
        renderGames([]);
        message.textContent = "Games cleared.";
        window.history.pushState(null, "", "/");
        updateSelection(true);
      }
    } catch (error: unknown) {
      message.dataset["error"] = "true";
      message.textContent = action === "new" ? "Unable to create game. Please try again." : "Unable to clear games. Please try again.";
      console.error("Lobby action failed:", error);
    } finally {
      mutating = false;
      newButton.disabled = clearButton.disabled = false;
      void refreshGames();
    }
  }
  
  if (!newButton || !clearButton || !list) {
    return;
  }

  newButton.addEventListener("click", () => void runAction("new"));
  clearButton.addEventListener("click", () => void runAction("clear"));
  list.addEventListener("click", (event: MouseEvent) => {
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
    
    updateSelection(true);
  });
  window.addEventListener("popstate", () => updateSelection());
  updateSelection();
  refreshGames();
  window.setInterval(() => refreshGames(), 1000);
}
