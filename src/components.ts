interface IPanelListDef {
  text: Node;
  children: IPanelListDef[];
}

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

  get lastPanel(): IPanelListDef[] {
    return this.stack[this.stack.length - 1];
  }

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
    this.appendChild(navItem);

    if (this.lastPanel === this.tree) {
      back.setAttribute('disabled', 'disabled');
    }

    this.cache.set(root, [navItem]);

    for (const item of root) {
      const panelItem = document.createElement('li');
      panelItem.appendChild(item.text);

      if (item.children.length) {
        const next = document.createElement('button');
        next.appendChild(item.text);
        next.onclick = () => this.forwardPanel(item.children);

        panelItem.appendChild(next);
      } else {
        panelItem.appendChild(item.text);
      }
      const f = this.cache.get(root);
      f && f.push(panelItem);

      this.appendChild(panelItem);
    }
  };

  forwardPanel = (root: IPanelListDef[]) => {
    this.stack.push(root);
    this.setPanel(root);
  };

  backwardPanel = () => {
    this.stack.pop();
    this.setPanel(this.lastPanel);
  };

  private clearPanel = () => {
    while (this.firstChild) {
      this.firstChild.remove();
    }
  };
}

export { PanelList };
