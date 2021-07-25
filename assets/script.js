document.onreadystatechange = () => {
    if (document.readyState === 'complete') {
        mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'loose',
            theme: 'base',
            themeVariables: {
                primaryColor: '#f7f7f7',
                secondaryColor: '#cddc39',
            }
        })

        const inputTextArea = document.querySelector('textarea#input')
        const outputTextArea = document.querySelector('textarea#output')
        const canvas = document.querySelector('div.canvas')

        const jsonInputTextAreaChanged = () => {
            try {
                const inputObj = JSON.parse(inputTextArea.value)
                const outputScript = generateMermaidScriptFromKeycloakAuthzConfig(inputObj)
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

        inputTextArea.addEventListener('input', jsonInputTextAreaChanged)

        fetch('/assets/default-value.json')
            .then(response => {
                response.text().then(value => {
                    inputTextArea.value = value
                    jsonInputTextAreaChanged()
                })
            })
    }
};

function generateMermaidScriptFromKeycloakAuthzConfig (kc) {
    const lines = []

    const scopesIdLookUp = {}
    const resourcesIdLookUp = {}
    const policiesIdLookUp = {}
    const roles = []

    for (const {id, name} of kc.scopes) {
        scopesIdLookUp[name] = id
    }

    for (const {name, _id, scopes} of kc.resources) {
        resourcesIdLookUp[name]=_id
        lines.push(`${_id}[(${name})]`)
        
        for (const scope of scopes ?? []) {
            const resourceScopeId = [_id, scopesIdLookUp[scope.name]].join('-')
            lines.push(`${resourceScopeId} --> ${_id}`)
            lines.push(`${resourceScopeId}{{${scope.name}}}`)
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
                lines.push(`${id} --> ${resourceScopeId}`)
            }
        }
    }

    return 'graph LR\n' + lines.map(x => "\t"+x).join("\n")
}
