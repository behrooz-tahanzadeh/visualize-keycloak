import { ResouceServer, ResourcePolicy, ScopePolicy } from "./types";

interface LookUp {
    [name: string]: string
}

export default function generateMermaidScript(resourceServer: ResouceServer, isolateId?: string) {
    const lines: string[] = []

    const resourcesIdLookUp: LookUp = {}
    const policiesIdLookUp: LookUp = {}

    resourceServer.resources.forEach(x => resourcesIdLookUp[x.name] = x._id)
    resourceServer.policies.forEach(x => policiesIdLookUp[x.name] = x.id)

    { // Add Resource Nodes
        lines.push('subgraph Resources')
        for (const {name, _id} of resourceServer.resources) {
            resourcesIdLookUp[name]=_id
            lines.push(`${_id}[(${name})]`)
        }
        lines.push('end')
    }

    { // Add Policy Nodes
        const permissions = [] as (ResourcePolicy|ScopePolicy)[]
        const notPermissions = [] as ResouceServer['policies']

        resourceServer.policies.forEach(x => {
            if(x.type === 'resource' || x.type === 'scope') {
                permissions.push(x)
            } else {
                notPermissions.push(x)
            }
        })

        const renderPolicy = (
            {id, type, name, logic}: ResouceServer['policies'][0],
            onlyNode: boolean = false
        ) => {
            const policyLogicIcon = (logic: string) => {
                return logic === 'POSITIVE' ? 'fa:fa-thumbs-up' : 'fa:fa-thumbs-down'
            }
            if(onlyNode) {
                return `${id}(( ${name.substring(0, 5)} ))`
            } else {
                return `${id}([${name} ${policyLogicIcon(logic)} ])`
            }
        }

        lines.push('subgraph Permissions')
        permissions.forEach(x => lines.push(renderPolicy(x)))
        lines.push('end')

        lines.push('subgraph Policies')
        notPermissions.forEach(x => lines.push(renderPolicy(x)))
        lines.push('end')
    }

    { // Add Scope Policy -> Resouce connections
        for (const policy of resourceServer.policies) {
            if(policy.type === 'scope') {
                const resources = JSON.parse(policy.config.resources) as string[]
                const scopes = JSON.parse(policy.config.scopes) as string[]

                for (const scope of scopes) {
                    const selected = (
                        isolateId === undefined ||
                        policy.id === isolateId ||
                        resourcesIdLookUp[resources[0]] === isolateId
                    )

                    lines.push([
                        policy.id,
                        resourcesIdLookUp[resources[0]]
                    ]. join(selected ?
                        ` == ${scope} === ` :
                        ` -. ${scope} .-`))
                }
            }
        }
    }

    { // Add apply policies connections
        for (const policy of resourceServer.policies) {
            if(policy.type === 'scope' || policy.type === 'resource') {
                const policyNames = JSON.parse(policy.config.applyPolicies) as string[]
                
                policyNames.forEach(y => {
                    const selected = (
                        isolateId === undefined ||
                        policy.id === isolateId ||
                        policiesIdLookUp[y] === isolateId
                    )
                    lines.push([
                        policiesIdLookUp[y],
                        policy.id
                    ].join(selected ? ' === ' : '-.-'))
                })
            }
        }
    }
    return 'graph LR\n' + lines.map(x => "\t"+x).join("\n")
}
