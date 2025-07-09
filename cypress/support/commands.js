// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

import 'cypress-wait-until';
import CypressComponentWrapper from '../component/CypressComponentWrapper.vue'
import { createPinia, setActivePinia } from 'pinia';
const UUIDS = {
    'Human Female': Cypress.env('HUMAN_FEMALE_UUID'),
    'Human Male': Cypress.env('HUMAN_MALE_UUID'),
    'Rat': Cypress.env('RAT_UUID'),
    'Mouse': Cypress.env('MOUSE_UUID'),
    'Pig': Cypress.env('PIG_UUID'),
    'Cat': Cypress.env('CAT_UUID')
}

Cypress.on('uncaught:exception', (err) => {
    // returning false here prevents Cypress from
    // failing the test
    if (err.message.includes('Source "markers" already exists.'))
        return false
    if (err.message.includes("this.facets.at is not a function"))
        return false
    if (err.message.includes("Cannot read properties of null (reading '$el')"))
        return false
    if (err.message.includes("Cannot read properties of null (reading 'length')"))
        return false
    return true
})

Cypress.Commands.add('loadMultiFlatmap', (entry, species = undefined) => {
    const readySpy = cy.spy().as('readySpy')
    const resourceSelectedSpy = cy.spy().as('resourceSelectedSpy')
    cy.get(entry).then((props) => {
        console.log('flatmapAPI', props)
        let propsPayload = props
        if (species) {
            propsPayload.initial = species
        }
        for (const [key, value] of Object.entries(UUIDS)) {
            if (
                key in propsPayload.availableSpecies && 
                'uuid' in propsPayload.availableSpecies[key]
            ) {
                propsPayload.availableSpecies[key].uuid = value
            }
        }
        propsPayload["onReady"] = readySpy
        propsPayload["onResourceSelected"] = resourceSelectedSpy
        cy.mount(CypressComponentWrapper, {
            propsData: {
                component: 'MultiFlatmapVuer',
                props: propsPayload,
            },
            global: {
                plugins: setActivePinia(createPinia())
            }
        }).then((vm) => {
            cy.wrap(vm).as('vm')
            window.vm = vm
        }).get('@vue').should('exist')
            // Now that we have the vue wrapper, check that the ready event is fired
            .then(() => {
                cy.get('@vue').should(wrapper => {
                    Cypress.multiFlatmapVuerWrapper = wrapper
                })
            })
    })
})