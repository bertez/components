interface IPanelListDef {
  text: Node;
  children: IPanelListDef[];
}

/** Extends the ul element */
class PanelList extends HTMLUListElement {
  tree: IPanelListDef[];
  stack: IPanelListDef[][];
  cache: Map<IPanelListDef[], Node[]>;

  constructor() {
    super();

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
   * Generate a tree of Panels definitions from the ul element
   * @param node The root ul element
   * @returns A panel definition
   * */
  static createULTree = (node: Node): IPanelListDef[] => {
    const isValid = (node: Node) =>
      node.nodeName === 'LI' &&
      node.childNodes.length > 0 &&
      ['#text', 'A'].includes(node.childNodes[0].nodeName);

    return Array.from(node.childNodes)
      .filter(isValid)
      .map(item => {
        const [text, children] = Array.from(item.childNodes);

        return {
          text,
          children:
            children && children.nodeName === 'UL'
              ? PanelList.createULTree(children)
              : []
        };
      });
  };

  /**
   * Writes a new panel
   * @param root A panel definition
   */
  private setPanel = (root: IPanelListDef[]) => {
    this.clearPanel();

    const rootCache = this.cache.get(root);

    if (rootCache && rootCache.length) {
      for (const node of rootCache) {
        this.appendChild(node);
      }

      return;
    }

    const navItem = document.createElement('li');
    navItem.setAttribute('role', 'navigation');

    const back = document.createElement('button');
    back.innerText = this.getAttribute('data-back') || '<';

    back.onclick = () => this.backwardPanel();

    navItem.appendChild(back);

    if (this.stack.length > 1) {
      const panelTitle = this.stack[this.stack.length - 2].find(
        i => i.children === root
      );

      panelTitle && navItem.appendChild(panelTitle.text.cloneNode());
    }

    this.appendChild(navItem);

    if (this.lastPanel === this.tree) {
      back.setAttribute('disabled', 'disabled');
    }

    this.cache.set(root, [navItem]);

    for (const item of root) {
      const panelItem = document.createElement('li');

      if (item.children.length) {
        const next = document.createElement('button');
        next.appendChild(item.text);
        next.onclick = () => this.forwardPanel(item.children);

        panelItem.appendChild(next);
      } else {
        let text = item.text;

        if (item.text.nodeName === '#text') {
          text = document.createElement('span');
          text.appendChild(item.text);
        }

        panelItem.appendChild(text);
      }
      const f = this.cache.get(root);
      f && f.push(panelItem);

      this.appendChild(panelItem);
    }
  };

  /**
   * Adds panel to the stack and write it
   * @param root A panel definition
   */
  forwardPanel = (root: IPanelListDef[]) => {
    this.stack.push(root);
    this.setPanel(root);
  };

  /**
   * Removes a panel from the stack and writes the last one
   */
  backwardPanel = () => {
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
