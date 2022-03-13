import generateMermaidScript from "./generate-mermaid-script.js";
import { ResouceServer } from "./types"

document.onreadystatechange = () => {
    if (document.readyState === 'complete') {
        const mermaid: any = (window as any).mermaid
        mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'loose',
            theme: 'base',
            htmlLabels:true,
            themeVariables: {
                primaryColor: '#f7f7f7',
                secondaryColor: '#cddc39',
            }
        })

        const inputTextArea = document.querySelector<HTMLTextAreaElement>('textarea#input')
        const outputTextArea = document.querySelector<HTMLTextAreaElement>('textarea#output')
        const canvas = document.querySelector<HTMLDivElement>('div.canvas')

        if(inputTextArea && outputTextArea && canvas) {

            const jsonInputTextAreaChanged = (isolateId?: string) => {
                try {
                    const inputObj = JSON.parse(inputTextArea.value)
                    console.log(inputObj)
                    const outputScript = generateMermaidScript(inputObj, isolateId)
                    outputTextArea.value = outputScript
    
                    mermaid.render(
                        'Graph',
                        outputScript,
                        (svgCode) => canvas.innerHTML = svgCode
                    )
    
                    inputTextArea.classList.remove('error')
                    outputTextArea.classList.remove('error')
                } catch(e) {
                    inputTextArea.classList.add('error')
                    outputTextArea.classList.add('error')
                    throw e
                }
            }
    
            inputTextArea.addEventListener('input', () => jsonInputTextAreaChanged())
    
            fetch('assets/default-value.json')
                .then(response => {
                    response.text().then(value => {
                        inputTextArea.value = value
                        jsonInputTextAreaChanged()
                    })
                })
    
            document.addEventListener('click', (event) => {
                const node = (event.target as HTMLElement).closest('.node.default')
                console.log(node)
                if(node && node.id.startsWith("flowchart-")) {
                    const nodeId = node.id.substring("flowchart-".length).substring(0, 36)
                    window.location.hash = nodeId
                    jsonInputTextAreaChanged(nodeId)
                }
            })
        }

    }
};
