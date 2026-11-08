import { HTTP_ENDPOINT, API_URL } from "./const";

export class TankiAPI {
    constructor() {}

    public async newGame(): Promise<string> {
        return await fetch(`${API_URL}/${HTTP_ENDPOINT.NEW}`).then(res => res.text()).catch(err => {
            console.log("ERROR")
            console.log(err)
            return err
        })
    }

    public async clearGames() {
        return await fetch(`${API_URL}/${HTTP_ENDPOINT.CLEAR}`).then(res => res.text()).catch(err => {
            console.log("ERROR")
            console.log(err)
            return err
        })
    }
}