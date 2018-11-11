class ByTab extends HTMLElement {
  private static tabCounter = 0;

  constructor() {
    super();
  }

  private connectedCallback(): void {
    this.setAttribute('role', 'tab');
    this.setAttribute('tabindex', '-1');

    if (!this.id) {
      this.id = `by-tab-${ByTab.tabCounter++}`;
    }
  }

  private attributeChangedCallback(): void {
    const isSelected = this.hasAttribute('selected');
    this.setAttribute('aria-selected', String(isSelected));
    this.setAttribute('tabindex', isSelected ? '0' : '-1');
  }

  static get observedAttributes(): string[] {
    return ['selected'];
  }

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

class ByPanel extends HTMLElement {
  private static panelCounter = 0;

  constructor() {
    super();
  }

  private connectedCallback(): void {
    this.setAttribute('role', 'tabpanel');

    if (!this.id) {
      this.id = `by-panel-${ByPanel.panelCounter++}`;
    }
  }
}

class ByTabs extends HTMLElement {
  private static KEYCODES = {
    DOWN: 40,
    END: 35,
    HOME: 36,
    LEFT: 37,
    RIGHT: 39,
    UP: 38
  };

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

  private static validEventTarget = (target: HTMLElement): boolean => {
    return target && target.getAttribute('role') === 'tab';
  };

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    this.shadowRoot!.appendChild(ByTabs.template.content.cloneNode(true));
  }

  public reset = (): void => {
    for (const tab of this.tabs) tab.selected = false;
    for (const panel of this.panels) panel.hidden = true;
  };

  public selectTab = (tab: ByTab): void => {
    this.reset();

    const targetPanel = this.getPanelForTab(tab);

    if (targetPanel) {
      targetPanel.hidden = false;
      tab.selected = true;
      tab.focus();
    }
  };

  private connectedCallback(): void {
    this.addEventListener('keydown', this.onKeyDown);
    this.addEventListener('click', this.onClick);

    if (!this.getAttribute('role')) this.setAttribute('role', 'tablist');

    Promise.all([
      customElements.whenDefined('by-tab'),
      customElements.whenDefined('by-panel')
    ]).then(_ => this.createRelationships());
  }

  private disconnectedCallback(): void {
    this.removeEventListener('keydown', this.onKeyDown);
    this.removeEventListener('click', this.onClick);
  }

  get tabs(): ByTab[] {
    return Array.from(this.querySelectorAll('by-tab'));
  }

  get panels(): ByPanel[] {
    return Array.from(this.querySelectorAll('by-panel'));
  }

  get firstTab(): ByTab {
    return this.tabs[0];
  }

  get lastTab(): ByTab {
    return this.tabs[this.tabs.length - 1];
  }

  get currentTab(): ByTab {
    return this.tabs.find(t => t.selected)!;
  }

  get currentTabIndex(): number {
    return this.tabs.findIndex(t => t.selected);
  }

  get nextTab(): ByTab {
    if (this.currentTab === this.lastTab) return this.firstTab;

    return this.tabs[this.currentTabIndex + 1];
  }

  get prevTab(): ByTab {
    if (this.currentTab === this.firstTab) return this.lastTab;
    return this.tabs[this.currentTabIndex - 1];
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement;
    if (!ByTabs.validEventTarget(target)) return;

    let targetTab;

    const { LEFT, RIGHT, DOWN, UP, HOME, END } = ByTabs.KEYCODES;

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

  private onClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    if (!ByTabs.validEventTarget(target)) return;

    this.selectTab(target as ByTab);
  };

  private createRelationships = (): void => {
    for (const tab of this.tabs) {
      const panel = tab.nextElementSibling;
      if (!panel || panel.tagName !== 'BY-PANEL') {
        console.error(
          `Tab with id: ${tab.id} next element is not a <by-panel>`
        );
        return;
      }

      tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('aria-labelledby', tab.id);
    }

    const defaultTab = this.tabs.find(t => t.selected) || this.tabs[0];

    this.selectTab(defaultTab);
  };

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
