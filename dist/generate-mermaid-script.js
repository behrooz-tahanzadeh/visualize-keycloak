export default function generateMermaidScript(resourceServer) {
    var _a;
    const lines = [];
    const resourcesIdLookUp = {};
    const policiesIdLookUp = {};
    resourceServer.resources.forEach(x => resourcesIdLookUp[x.name] = x._id);
    resourceServer.policies.forEach(x => policiesIdLookUp[x.name] = x.id);
    { // Add Resource Nodes
        lines.push('subgraph Resources');
        for (const { name, _id } of resourceServer.resources) {
            resourcesIdLookUp[name] = _id;
            lines.push(`${_id}[(${name})]`);
        }
        lines.push('end');
    }
    { // Add Policy Nodes
        const permissions = [];
        const notPermissions = [];
        resourceServer.policies.forEach(x => {
            if (x.type === 'resource' || x.type === 'scope') {
                permissions.push(x);
            }
            else {
                notPermissions.push(x);
            }
        });
        const renderPolicy = ({ id, type, name, logic }, onlyNode = false) => {
            const policyLogicIcon = (logic) => {
                return logic === 'POSITIVE' ? 'fa:fa-thumbs-up' : 'fa:fa-thumbs-down';
            };
            if (onlyNode) {
                return `${id}(( ${name.substring(0, 5)} ))`;
            }
            else {
                return `${id}([${name} ${policyLogicIcon(logic)} ])`;
            }
        };
        lines.push('subgraph Permissions');
        permissions.forEach(x => lines.push(renderPolicy(x)));
        lines.push('end');
        lines.push('subgraph Policies');
        notPermissions.forEach(x => lines.push(renderPolicy(x)));
        lines.push('end');
    }
    { // Add Scope Policy -> Resouce connections
        for (const policy of resourceServer.policies) {
            if (policy.type === 'scope') {
                const resources = JSON.parse(policy.config.resources);
                const scopes = JSON.parse(policy.config.scopes);
                for (const scope of scopes) {
                    lines.push([
                        policy.id,
                        resourcesIdLookUp[resources[0]]
                    ].join(` == ${scope} === `));
                }
            }
        }
    }
    { // Add Scope Policy -> Resouce connections
        for (const policy of resourceServer.policies) {
            if (policy.type === 'resource') {
                const resources = JSON.parse((_a = policy.config.resources) !== null && _a !== void 0 ? _a : "[]");
                for (const resource of resources) {
                    lines.push([
                        policy.id,
                        resourcesIdLookUp[resource]
                    ].join(` === `));
                }
            }
        }
    }
    { // Add apply policies connections
        for (const policy of resourceServer.policies) {
            if (policy.type === 'scope' || policy.type === 'resource' || policy.type === 'aggregate') {
                const policyNames = JSON.parse(policy.config.applyPolicies);
                policyNames.forEach(y => {
                    lines.push([
                        policiesIdLookUp[y],
                        policy.id
                    ].join(' === '));
                });
            }
        }
    }
    return 'graph LR\n' + lines.map(x => "\t" + x).join("\n");
}
