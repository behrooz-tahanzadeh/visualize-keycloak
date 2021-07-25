importScripts('https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js')

addEventListener('message', ev => {
    console.log(ev.data)
    mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
            primaryColor: '#f7f7f7',
            secondaryColor: '#cddc39',
        }
    })
    
    mermaid.render(
        'Graph',
        ev.data,
        postMessage
    )
})
