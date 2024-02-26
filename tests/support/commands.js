import 'cypress-file-upload';

Cypress.skipAfterFail = ({ skipAllSuits = false } = {}) => {
  before(function() {
    // stop all if an important test failed before
    cy.task('dynamicSharedStore', { name: 'cancelTests' }).then(
      hasImportantTestFallen => {
        if (hasImportantTestFallen) {
          Cypress.runner.stop();
        }
      },
    );
  });
  afterEach(function() {
    if (this.currentTest.state === 'failed') {
      if (!Cypress.config('isInteractive')) {
        // isInteractive is true for headed browsers (suite started with 'cypress open' command)
        // and false for headless ('cypress run')
        // This will skip remaining test in the current context when a test fails.
        Cypress.runner.stop();
      }
      if (skipAllSuits) {
        cy.task('dynamicSharedStore', {
          name: 'cancelTests',
          value: true,
        }).then(() => {
          cy.log('Skipping all remaining tests');
        });
      }
    }
  });
};

Cypress.Commands.add('filterWithNoValue', { prevSubject: true }, $elements =>
  $elements.filter((_, e) => !e.value),
);

Cypress.Commands.add('checkItemOnGenericListLink', resourceName => {
  cy.get('ui5-table-row')
    .find('ui5-table-cell')
    .contains('span', resourceName)
    .should('be.visible');
});

Cypress.Commands.add('clickGenericListLink', resourceName => {
  cy.get('ui5-table-row')
    .find('ui5-table-cell')
    .contains('span', resourceName)
    .click();
});

Cypress.Commands.add('goToNamespaceDetails', () => {
  // Go to the details of namespace
  cy.getLeftNav()
    .contains('Namespaces')
    .click();

  cy.clickGenericListLink(Cypress.env('NAMESPACE_NAME'));

  return cy.end();
});

Cypress.Commands.add('clearInput', { prevSubject: true }, element => {
  return cy
    .wrap(element)
    .type(
      `${Cypress.platform === 'darwin' ? '{cmd}a' : '{ctrl}a'} {backspace}`,
    );
});

/**
 * Simulates a paste event.
 *
 * @example
 * cy.get('some-selector').paste({
 *  pastePayload: 'String example'
 *  });
 */
Cypress.Commands.add(
  'paste',
  {
    prevSubject: true,
  },
  paste,
);

/**
 * Simulates a paste event.
 *
 * @param subject A jQuery context representing a DOM element.
 * @param pastePayload Simulated String that is on the clipboard.
 *
 * @returns The subject parameter.
 */
function paste(subject, { pastePayload }) {
  // https://developer.mozilla.org/en-US/docs/Web/API/Element/paste_event
  const pasteEvent = Object.assign(
    new Event('paste', { bubbles: true, cancelable: true }),
    {
      clipboardData: {
        getData: (type = 'text') => pastePayload,
      },
    },
  );
  subject[0].dispatchEvent(pasteEvent);

  return subject;
}

Cypress.Commands.add('getLeftNav', () => {
  return cy.get('aside', { timeout: 10000 });
});

Cypress.Commands.add('deleteInDetails', () => {
  cy.get('ui5-button')
    .contains('Delete')
    .should('be.visible')
    .click();

  cy.contains(`delete ${resourceType} ${resourceName}`);
  cy.get(`[header-text="Delete ${resourceType}"]`)
    .find('[data-testid="delete-confirmation"]')
    .click();

  cy.contains(/deleted/).should('be.visible');
});

Cypress.Commands.add(
  'deleteFromGenericList',
  (
    resourceType,
    resourceName,
    confirmationEnabled = true,
    deletedVisible = true,
  ) => {
    cy.get('ui5-combobox[placeholder="Search"]')
      .find('input')
      .click()
      .type(resourceName);

    cy.checkItemOnGenericListLink(resourceName);

    cy.get('ui5-button[data-testid="delete"]').click();

    if (confirmationEnabled) {
      cy.contains(`delete ${resourceType} ${resourceName}`);
      cy.get(`[header-text="Delete ${resourceType}"]`)
        .find('[data-testid="delete-confirmation"]')
        .click();

      if (deletedVisible) {
        cy.contains('ui5-message-strip', /deleted/).should('be.visible');
      }

      cy.get('ui5-table')
        .contains(resourceName)
        .should('not.exist');
    }
  },
);
