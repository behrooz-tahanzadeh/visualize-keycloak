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

            const jsonInputTextAreaChanged = () => {
                try {
                    const inputObj = JSON.parse(inputTextArea.value)
                    const outputScript = generateMermaidScript(inputObj)
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
                if(node && node.id.startsWith("flowchart-")) {
                    const nodeId = node.id.substring("flowchart-".length).substring(0, 36)

                    canvas.querySelectorAll<SVGGElement>('g.edgePath').forEach(e => {
                        e.style.opacity = '0.1'
                        e.style.transition = '0.5s opacity'

                        const p = e.querySelector<SVGPathElement>('path')
                        if(p) p.style.strokeWidth = '1'
                    })

                    let start = [nodeId]

                    while(start.length > 0) {
                        const startClasses = start.map(c => `g.edgePath.LS-${c}`).join(', ')
                        const edges = canvas.querySelectorAll<SVGGElement>(startClasses)
                        start = []
                        edges.forEach(e => {
                            e.style.opacity = '1'
                            const p = e.querySelector<SVGPathElement>('path')
                            if(p) p.style.strokeWidth = '3'

                            const le = Array
                                .from(e.classList)
                                .find(c => c.startsWith('LE-'))
                                ?.substring(3)

                            if(le) start.push(le)
                        })
                    }

                    start = [nodeId]

                    while(start.length > 0) {
                        const startClasses = start.map(c => `g.edgePath.LE-${c}`).join(', ')
                        const edges = canvas.querySelectorAll<SVGGElement>(startClasses)
                        start = []
                        edges.forEach(e => {
                            e.style.opacity = '1'
                            const p = e.querySelector<SVGPathElement>('path')
                            if(p) p.style.strokeWidth = '3'
                            const le = Array
                                .from(e.classList)
                                .find(c => c.startsWith('LS-'))
                                ?.substring(3)

                            if(le) start.push(le)
                        })
                    }
                }
            })
        }

    }
};
