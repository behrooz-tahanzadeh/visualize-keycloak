export interface Attributes {
}

export interface Resource {
    name: string
    type: string
    ownerManagedAccess: boolean
    attributes: Attributes
    _id: string
    uris: string[]
    displayName: string
    scopes: Scope[]
}

export interface Config {
    code: string
    defaultResourceType: string
    applyPolicies: string
    resources: string
}

export interface Policy {
    id: string
    name: string
    description: string
    logic: string
    decisionStrategy: string
}

export interface RolePolicy extends Policy {
    type: 'role'
    config: {
        roles: string
    }
}

export interface JsPolicy extends Policy {
    type: 'js'
    config: {
        code: string
    }
}

export interface ScopePolicy extends Policy {
    type: 'scope'
    config: {
        applyPolicies: string
        resources: string
        scopes: string
    }
}

export interface ResourcePolicy extends Policy {
    type: 'resource'
    config: {
        resources: string | undefined
        applyPolicies: string
    }
}

export interface AggregatePolicy extends Policy {
    type: 'aggregate'
    config: {
        applyPolicies: string
    }
}

export interface Scope {
    id: string
    name: string
}

export interface ResouceServer {
    allowRemoteResourceManagement: boolean
    policyEnforcementMode: string
    resources: Resource[]
    policies: (RolePolicy|JsPolicy|ScopePolicy|ResourcePolicy|AggregatePolicy)[]
    scopes: Scope[]
    decisionStrategy: string
}