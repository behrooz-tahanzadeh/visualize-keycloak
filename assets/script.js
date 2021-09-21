document.onreadystatechange = () => {
    if (document.readyState === 'complete') {
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

        const inputTextArea = document.querySelector('textarea#input')
        const outputTextArea = document.querySelector('textarea#output')
        const canvas = document.querySelector('div.canvas')

        const jsonInputTextAreaChanged = (isolateId) => {
            try {
                const inputObj = JSON.parse(inputTextArea.value)
                const outputScript = generateMermaidScriptFromKeycloakAuthzConfig(inputObj, isolateId)
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
            const node = event.target.closest('.node.default')
            if(node && node.id.startsWith("flowchart-")) {
                const nodeId = node.id.substring("flowchart-".length)
                window.location.hash = nodeId
                jsonInputTextAreaChanged(nodeId)
            }
        })
    }
};

function generateMermaidScriptFromKeycloakAuthzConfig (kc, isolateId) {
    const lines = []
    const scopesIdLookUp = {}
    const resourcesIdLookUp = {}
    const policiesIdLookUp = {}
    const roles = []

    // {
    //     "id": "e283b2af-45f6-44fa-993e-5f9567c4eeb2",
    //     "name": "kc_create"
    // }
    for (const {id, name} of kc.scopes) {
        scopesIdLookUp[name] = id
    }

    const includedIds = []

    for (const {name, _id, scopes} of kc.resources) {
        console.log(isolateId, _id, _id === isolateId)
        if(isolateId === undefined || isolateId.startsWith(_id)) {
            resourcesIdLookUp[name]=_id
            includedIds.push(_id)
            lines.push(`${_id}[(${name})]`)
            
            for (const scope of scopes ?? []) {
                const resourceScopeId = [_id, scopesIdLookUp[scope.name]].join('-')
                lines.push(`${resourceScopeId} --> ${_id}`)
                lines.push(`${resourceScopeId}{{${scope.name}}}`)
                includedIds.push(resourceScopeId)
            }
        }
    }

    const policyLogicIcon = (logic) => {
        return logic === 'POSITIVE' ? 'fa:fa-thumbs-up' : 'fa:fa-thumbs-down'
    }

    // "id": "0bc426aa-7feb-4474-be87-d5942a2447d9",
    // "name": "kc_is_role",
    // "type": "role",
    // "logic": "POSITIVE",
    // "decisionStrategy": "UNANIMOUS",
    // "config": {
    //     "roles": "[{\"id\":\"kc_role_2\",\"required\":false},{\"id\":\"kc_role_1\",\"required\":true}]"
    // }
    for(const {id, name, config, logic} of kc.policies.filter(x => x.type === "role")) {
        lines.push(`${id}([${name} ${policyLogicIcon(logic)}])`)
        policiesIdLookUp[name]=id

        for(const {id: roleId, required} of JSON.parse(config.roles)) {
            if(!roles.includes(roleId)) {
                roles.push(roleId)
                lines.push(`${roleId}(${roleId})`)
            }
            lines.push(`${roleId} ---> ${required ? '|.required.|' : ''} ${id}`)
        }
    }

    // "id": "19708d3a-184d-486a-961e-6d662453a54d",
    // "name": "kc_permission_1",
    // "type": "scope",
    // "logic": "POSITIVE",
    // "decisionStrategy": "UNANIMOUS",
    // "config": {
    //     "resources": "[\"kc_resource_1\"]",
    //     "scopes": "[\"kc_create\"]",
    //     "applyPolicies": "[\"kc_is_role\"]"
    // }
    for(const {id, name, config, logic} of kc.policies.filter(x => x.type === "scope")) {
        lines.push(`${id}[[${name} ${policyLogicIcon(logic)}]]`)

        for(const policyName of JSON.parse(config.applyPolicies)) {
            lines.push(`${policiesIdLookUp[policyName]} --> ${id}`)
        }

        for(const resourceName of JSON.parse(config.resources)) {
            for(const scopeName of JSON.parse(config.scopes)) {
                const resourceScopeId = [resourcesIdLookUp[resourceName], scopesIdLookUp[scopeName]].join('-')

                if(includedIds.includes(resourceScopeId)) {
                    lines.push(`${id} --> ${resourceScopeId}`)
                }
            }
        }
    }

    return 'graph LR\n' + lines.map(x => "\t"+x).join("\n")
}
