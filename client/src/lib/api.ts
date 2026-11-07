export async function api() {
    return fetch('https://51.250.87.166/games').then(res => res.text()).catch(err => {
        console.log("ERROR")
        console.log(err)
    })
}