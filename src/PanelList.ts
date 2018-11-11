interface IPanelListDef {
  text: Node;
  children: IPanelListDef[];
}

/** Extends the ul element */
class PanelList extends HTMLUListElement {
  /**
   * Generate a tree of Panels definitions from the ul element
   * @param node The root ul element
   * @returns A panel definition
   **/
  private static createULTree = (node: Node): IPanelListDef[] => {
    const isValid = (listNode: Node) =>
      listNode.nodeName === 'LI' &&
      listNode.childNodes.length > 0 &&
      ['#text', 'A'].includes(listNode.childNodes[0].nodeName);

    return Array.from(node.childNodes)
      .filter(isValid)
      .map(item => {
        const [text, children] = Array.from(item.childNodes);

        return {
          children:
            children && children.nodeName === 'UL'
              ? PanelList.createULTree(children)
              : [],
          text
        };
      });
  };

  /**
   * Wraps a Node into another
   * @param node The node to be wrapped
   * @param tagName The tagName of the wrapper
   */
  private static wrapNode = (node: Node, tagName: string): Node => {
    const wrapped = document.createElement(tagName);
    wrapped.appendChild(node);
    return wrapped;
  };

  private tree: IPanelListDef[];
  private stack: IPanelListDef[][];
  private cache: Map<IPanelListDef[], Node[]>;

  constructor() {
    super();

    // Init main class properties
    this.tree = PanelList.createULTree(this as Node);
    this.stack = [];
    this.cache = new Map();

    this.clearPanel();
    this.forwardPanel(this.tree);
    this.removeAttribute('hidden');
  }

  /** Returns las panel in current stack */
  get lastPanel(): IPanelListDef[] {
    return this.stack[this.stack.length - 1];
  }

  /**
   * Writes a new panel
   * @param root A panel definition
   */
  private setPanel = (root: IPanelListDef[]) => {
    this.clearPanel();

    // Check if we have a panel cache and render it
    const rootCache = this.cache.get(root);

    if (rootCache && rootCache.length) {
      for (const node of rootCache) {
        this.appendChild(node);
      }

      return;
    }

    // Build navigation
    const navItem = document.createElement('li');
    navItem.setAttribute('role', 'navigation');

    const back = document.createElement('button');
    back.innerText = this.getAttribute('data-back') || '<';

    back.onclick = () => this.backwardPanel();

    navItem.appendChild(back);

    // Sets a title if the panel is not initial
    if (this.stack.length > 1) {
      // We get the title of the previous panel on the stack
      const panelTitle = this.stack[this.stack.length - 2].find(
        i => i.children === root
      );

      if (panelTitle) {
        navItem.appendChild(
          PanelList.wrapNode(panelTitle.text.cloneNode(), 'span')
        );
      }
    }

    // Render navigation
    this.appendChild(navItem);

    // Disable navigation if the panel is initial
    if (this.lastPanel === this.tree) {
      back.setAttribute('disabled', 'disabled');
    }

    // Cache navigation
    this.cache.set(root, [navItem]);

    // Write all the actual panel items
    for (const item of root) {
      const panelItem = document.createElement('li');

      // Render a button if the item has children
      if (item.children.length) {
        const next = document.createElement('button');
        next.appendChild(item.text);
        next.onclick = () => this.forwardPanel(item.children);

        panelItem.appendChild(next);
      } else {
        // Wrap text on a span if the item does not have children
        let text = item.text;

        if (item.text.nodeName === '#text') {
          text = PanelList.wrapNode(item.text, 'span');
        }

        panelItem.appendChild(text);
      }
      // Cache the item
      this.cache.get(root)!.push(panelItem);

      // Render it
      this.appendChild(panelItem);
    }
  };

  /**
   * Adds panel to the stack and write it
   * @param root A panel definition
   */
  private forwardPanel = (root: IPanelListDef[]) => {
    this.stack.push(root);
    this.setPanel(root);
  };

  /**
   * Removes a panel from the stack and writes the last one
   */
  private backwardPanel = () => {
    this.stack.pop();
    this.setPanel(this.lastPanel);
  };

  /**
   * Clears the element
   */
  private clearPanel = () => {
    while (this.firstChild) {
      this.firstChild.remove();
    }
  };
}

export { PanelList };

export default () => {
  customElements.define('panel-list', PanelList, { extends: 'ul' });
};
