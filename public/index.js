const getData = async () => {
    const res = await fetch('/data', {})
    const data = await res.json()
}

getData()