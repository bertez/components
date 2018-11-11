/**
 * @class ByTab defines a tab component
 */
class ByTab extends HTMLElement {
  // Internal instance counter
  private static tabCounter = 0;

  /**
   * Array of attributes to watch:
   * every time one of these attributes are added, changed or removed
   * this.attributeChangedCallback will be fired
   */
  static get observedAttributes(): string[] {
    return ['selected'];
  }

  constructor() {
    super();
  }

  // Set initial a11y attributes and a unique id
  private connectedCallback(): void {
    this.setAttribute('role', 'tab');
    this.setAttribute('tabindex', '-1');

    if (!this.id) {
      this.id = `by-tab-${ByTab.tabCounter++}`;
    }
  }

  // Update update a11y when observed attributes are modified
  private attributeChangedCallback(): void {
    const isSelected = this.hasAttribute('selected');
    this.setAttribute('aria-selected', String(isSelected));
    this.setAttribute('tabindex', isSelected ? '0' : '-1');
  }

  // Selected setter and getter
  public get selected(): boolean {
    return this.getAttribute('selected') !== null;
  }

  public set selected(value: boolean) {
    if (value) {
      this.setAttribute('selected', 'selected');
    } else {
      this.removeAttribute('selected');
    }
  }
}

/**
 * @class ByPanel defines a panel component
 */
class ByPanel extends HTMLElement {
  // Internal instance counter
  private static panelCounter = 0;

  constructor() {
    super();
  }

  // Set initial a11y attributes and a unique id
  private connectedCallback(): void {
    this.setAttribute('role', 'tabpanel');

    if (!this.id) {
      this.id = `by-panel-${ByPanel.panelCounter++}`;
    }
  }
}

/**
 * @class ByTabs defines a complete tabs component
 */
class ByTabs extends HTMLElement {
  // Recognized keycodes
  private static KEYCODES = {
    DOWN: 40,
    END: 35,
    HOME: 36,
    LEFT: 37,
    RIGHT: 39,
    UP: 38
  };

  /**
   * Template used by the component to order the elements using slots,
   * also to define very basic style that sets the element to display flex
   * so the tabs flows in one line and the panels take all the horizontal space
   */
  private static get template() {
    const template = document.createElement('template');

    template.innerHTML = `
      <style type="text/css">
        :host {
          display: flex;
          flex-wrap: wrap;
        }
        ::slotted(by-panel) {
          flex-basis: 100%;
        }
      </style>
      <slot name="title">Empty title</slot>
      <slot name="content">Empty content</slot>
    `;

    return template;
  }

  // Checks if the target of click and keyboard events exists and is a tab component
  private static validEventTarget = (target: HTMLElement): boolean => {
    return target && target.getAttribute('role') === 'tab';
  };

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    // Add the template to the component (shadowRoot is always defined, hence the non-null assertion)
    this.shadowRoot!.appendChild(ByTabs.template.content.cloneNode(true));
  }

  // Hide all the panels and remove selected tab
  public reset = (): void => {
    for (const tab of this.tabs) tab.selected = false;
    for (const panel of this.panels) panel.hidden = true;
  };

  // Select a tab component showing the related panel
  public selectTab = (tab: ByTab): void => {
    this.reset();

    const targetPanel = this.getPanelForTab(tab);

    if (targetPanel) {
      targetPanel.hidden = false;
      tab.selected = true;
      tab.focus();
    }
  };

  // Set initial a11y attributes and events
  private connectedCallback(): void {
    this.addEventListener('keydown', this.onKeyDown);
    this.addEventListener('click', this.onClick);

    if (!this.getAttribute('role')) this.setAttribute('role', 'tablist');

    // Wait for the children components to be defined
    Promise.all([
      customElements.whenDefined('by-tab'),
      customElements.whenDefined('by-panel')
    ]).then(_ => this.createRelationships());
  }

  // Remove event listeners
  private disconnectedCallback(): void {
    this.removeEventListener('keydown', this.onKeyDown);
    this.removeEventListener('click', this.onClick);
  }

  // getter: all the tabs
  get tabs(): ByTab[] {
    return Array.from(this.querySelectorAll('by-tab'));
  }

  // getter: all the panels
  get panels(): ByPanel[] {
    return Array.from(this.querySelectorAll('by-panel'));
  }

  // getter: first tab
  get firstTab(): ByTab {
    return this.tabs[0];
  }

  // getter: last tab
  get lastTab(): ByTab {
    return this.tabs[this.tabs.length - 1];
  }

  // getter: current selected tab
  get currentTab(): ByTab {
    return this.tabs.find(t => t.selected)!;
  }

  // getter: current selected tab index on the tabs array
  get currentTabIndex(): number {
    return this.tabs.findIndex(t => t.selected);
  }

  // getter: the next tab, wraps
  get nextTab(): ByTab {
    if (this.currentTab === this.lastTab) return this.firstTab;

    return this.tabs[this.currentTabIndex + 1];
  }

  // getter: the previous tab, wraps
  get prevTab(): ByTab {
    if (this.currentTab === this.firstTab) return this.lastTab;
    return this.tabs[this.currentTabIndex - 1];
  }

  /**
   * Handle keyboard events
   * @param event keyboard event
   */
  private onKeyDown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement;

    // Check if the event is valid
    if (!ByTabs.validEventTarget(target)) return;

    let targetTab;

    const { LEFT, RIGHT, DOWN, UP, HOME, END } = ByTabs.KEYCODES;

    // select target tab based on key pressed
    switch (event.keyCode) {
      case RIGHT:
      case DOWN:
        targetTab = this.nextTab;
        break;
      case LEFT:
      case UP:
        targetTab = this.prevTab;
        break;
      case HOME:
        targetTab = this.firstTab;
        break;
      case END:
        targetTab = this.lastTab;
        break;
      default:
        return;
    }

    this.selectTab(targetTab as ByTab);

    event.preventDefault();
  };

  /**
   * Handle mouse events
   * @param event mouse event
   */
  private onClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    if (!ByTabs.validEventTarget(target)) return;

    this.selectTab(target as ByTab);
  };

  // Sets up relationships between tab and panel using id and aria attributes
  private createRelationships = (): void => {
    for (const tab of this.tabs) {
      const panel = tab.nextElementSibling;
      if (!panel || panel.tagName !== 'BY-PANEL') {
        console.error(
          `The next element sibling of the tab with id: ${
            tab.id
          } is not a <by-panel>. Tab will be ignored.`
        );

        return;
      }

      tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('aria-labelledby', tab.id);
    }

    // Select initial tab
    const defaultTab = this.tabs.find(t => t.selected) || this.tabs[0];

    this.selectTab(defaultTab);
  };

  /**
   * @param tab A tab component
   * @returns The panel component related to the tab
   */
  private getPanelForTab = (tab: ByTab): ByPanel | undefined => {
    const panel = this.panels.find(
      p => p.getAttribute('aria-labelledby') === tab.id
    );

    return panel;
  };
}

export { ByTabs, ByTab, ByPanel };

export default () => {
  customElements.define('by-tab', ByTab);
  customElements.define('by-panel', ByPanel);
  customElements.define('by-tabs', ByTabs);
};
